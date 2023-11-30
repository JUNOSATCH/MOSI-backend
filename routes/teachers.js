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

// 전체 선생님 목록
router.get("/all", async (req, res, next) => {
  try {
    const teachers = await getAll();
    res.status(200).json({ success: true, teachers });
  } catch(err) {
    console.error(err);
    next(err);
  }
});

// 학급으로 검색: 담임선생님 검색
router.get("/classroom/:classroom", async (req, res, next) => {
  try {
    const classroom = decodeURI(req.params.classroom);
    const teacher = await getHomeroom(classroom);
    if (teacher == undefined) res.status(200).json({ success: false });
    else res.status(200).json({ success: true, teacher: teacher });
  } catch(err) {
    console.error(err);
    next(err);
  }
});

// 메인페이지 표시용 목록: 담임선생님이 가장 앞에
router.get("/main/:classroom", async (req, res, next) => {
  try {
    const classroom = decodeURI(req.params.classroom);
    const homeroom = await getHomeroom(classroom);
    const teachers = await getAll();
    let result = []
    if (homeroom != undefined) {
      result.push(homeroom);
      teachers.forEach((teacher) => {
        if (homeroom.id != teacher.id) result.push(teacher);
      });
    }
    else result = teachers;
    res.status(200).json({ success: true, teachers: result });
  } catch(err) {
    console.error(err);
    next(err);
  }
});


module.exports = router;