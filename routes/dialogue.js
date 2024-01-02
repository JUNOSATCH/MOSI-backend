const express = require("express");
const db = require("../config/database");

const router = express.Router();


router.post("/enter", async (req, res, next) => {
  try {
    const name = req.body.name;
    const result = await db.query("insert into dialogues(username) value(?);", [name]);
    const id = result[0].insertId;
    res.status(200).json({ success: true, id });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.get("/recordList", async (req, res, next) => {
  try {
    const result = await db.query("select * from dialogues;");
    const dialogues = result[0];
    res.status(200).json(dialogues);
  } catch (err) {
    console.error(err);
    next(err);
  }
});

router.get("/record/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    const result = await db.query("select * from dialogues where id=?;", [id]);
    const info = result[0][0];
    res.status(200).json(info);
  } catch (err) {
    console.error(err);
    next(err);
  }
});


module.exports = router;