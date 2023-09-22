const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const db = require("../config/database");

const { isLoggedIn } = require("./middlewares");

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


router.post("/new", audioUpload, (req, res, next) => {
  console.log(req.files);
  console.log(req.body);
  res.json({ success: true });
  // console.log(req.file);
  // const originalUrl = req.file.location;
  // const url = originalUrl.replace(/\/original\//, "/thumb/");
  // res.json({ success: true, url, originalUrl });
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