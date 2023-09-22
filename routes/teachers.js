const express = require("express");
const db = require("../config/database");

const { isLoggedIn } = require("./middlewares");

const router = express.Router();

const getHomeroom = async (classroom) => {
  const result = await db.query("select * from users, teachers where users.id=teachers.id and users.type='teacher' and homeroom=?;", [classroom]);
  const teacher = result[0][0];
  return teacher;
}
const getAll = async () => {
  const result = await db.query("select * from users, teachers where users.id=teachers.id;");
  const teachers = result[0];
  return teachers;
}

router.get("/all", isLoggedIn, async (req, res, next) => {
  try {
    const teachers = await getAll();
    res.status(200).json({ success: true, teachers });
  } catch(err) {
    console.error(err);
    next(err);
  }
});

router.get("/classroom/:classroom", isLoggedIn, async (req, res, next) => {
  try {
    const classroom = decodeURI(req.params.classroom);
    const teacher = await getHomeroom(classroom);
    res.status(200).json({ success: true, teacher });
  } catch(err) {
    console.error(err);
    next(err);
  }
});

router.get("/main/:classroom", isLoggedIn, async (req, res, next) => {
  try {
    const classroom = decodeURI(req.params.classroom);
    const homeroom = await getHomeroom(classroom);
    const teachers = await getAll();
    const result = [homeroom];
    teachers.forEach((teacher) => {
      if (homeroom.id != teacher.id) result.push(teacher);
    });
    console.log(result);
    res.status(200).json({ success: true, teachers: result });
  } catch(err) {
    console.error(err);
    next(err);
  }
});


module.exports = router;