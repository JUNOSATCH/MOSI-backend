const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const db = require("../config/database");
const Axios = require("axios").default;

try {
  fs.readdirSync('audios');
} catch(err) {
  console.error("no directory 'audios', created one");
  fs.mkdirSync('audios');
}
try {
  fs.readdirSync('texts');
} catch(err) {
  console.error("no directory 'texts', created one");
  fs.mkdirSync('texts');
}

const router = express.Router();

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) { cb(null, 'audios/'); },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, path.basename(file.originalname, ext) + Date.now() + ext);
    }
  })
});

const audioUpload = upload.fields([
  { name: "parent" },
  { name: "teacher" },
  { name: "file" }
]);


router.post("/new", audioUpload, async (req, res, next) => {
  const formData = new FormData();
  formData.append(
    'file',
    fs.createReadStream(path.join("/Users/youngmin/Desktop/SYM/Code/Project/2023Hackerton", req.files.file[0].path)),
  );
  const url = 'http://1288-35-201-249-213.ngrok-free.app/audio';
  const response = await Axios({
    method: 'post',
    url,
    data: formData,
    headers: {
      ...formData.getHeaders(),
    },
  });
  res.status(200).json(response.data);
});

router.get("/list/:teacher", async (req, res, next) => {
  try {
    const teacher = decodeURI(req.params.teacher);
    const result = await db.query("select id, parent, teacher from calls where teacher=?;", [teacher]);
    const calls = result[0];
    res.status(200).json({ success: true, calls });
  } catch(err) {
    console.error(err);
    next(err);
  }
});

router.get("/content/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const result = await db.query("select content from calls where id=?;", [id]);
    const content = result[0][0];
    res.status(200).json({ success: true, content });
  } catch(err) {
    console.error(err);
    next(err);
  }
});


module.exports = router;