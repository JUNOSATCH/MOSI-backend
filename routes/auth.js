const express = require("express");
const bcrypt = require("bcrypt");
const passport = require("passport");

const db = require("../config/database");
const { isLoggedIn, isNotLoggedIn } = require("./middlewares");
const logger = require("../config/logger");


const router = express.Router();

// teacher join
router.post("/join/teacher", isNotLoggedIn, async (req, res, next) => {
  const { id, name, password, classroom, subject } = req.body;

  console.log(req.body);

  const result = await db.query("select * from users where email=?", [id]);
  const user = result[0][0];
  if (user) return res.json({ success: false, msg: "user already exists" });
  try {
    const hash = await bcrypt.hash(password, 12);
    const newUser = {
      id,
      name,
      password: hash,
      classroom,
      subject,
      type: "teacher"
    };
    const info = await db.query("insert into users(email, name, password, homeroom, type) value(?, ?, ?, ?, ?);", [newUser.id, newUser.name, newUser.password, newUser.classroom, newUser.type]);
    const userId = info[0].insertId;
    await db.query("insert into teachers(id, subject) value(?, ?);", [userId, newUser.subject]);
    res.status(200).json({ success: true, msg: "user joined successfully" });
  } catch(err) {
    logger.error(err);
    console.error(err);
    next(err);
  }
});

// parent join
router.post("/join/parent", isNotLoggedIn, async (req, res, next) => {
  const { id, name, password, classroom } = req.body;

  console.log(req);
  // console.log(req.body);

  const result = await db.query("select * from users where email=?", [id]);
  const user = result[0][0];
  if (user) return res.json({ success: false, msg: "user already exists" });
  try {
    const hash = await bcrypt.hash(password, 12);
    const newUser = {
      id,
      name,
      password: hash,
      classroom,
      type: "parent",
      manner: 100
    };
    const info = await db.query("insert into users(email, name, password, homeroom, type) value(?, ?, ?, ?, ?);", [newUser.id, newUser.name, newUser.password, newUser.classroom, newUser.type]);
    const userId = info[0].insertId;
    await db.query("insert into parents(id, manner) value(?, ?);", [userId, newUser.manner]);
    res.status(200).json({ success: true, msg: "user joined successfully" });
  } catch(err) {
    logger.error(err);
    console.error(err);
    next(err);
  }
});

// login
router.post("/login", isNotLoggedIn, (req, res, next) => {
  passport.authenticate("local", (errAuth, user, info) => {
    if (errAuth) {
      logger.error(errAuth);
      console.error(errAuth);
      next(errAuth);
    }
    if (!user) return res.status(200).json({ success: false, msg: info.msg });
    return req.login(user, (errLogin) => {
      if (errLogin) {
        logger.error(errLogin);
        console.error(errLogin);
        next(errLogin);
      }
      res.status(200).json({ success: true, msg: "logged in successfully" });
    });
  })(req, res, next);
});

// logout
router.get("/logout", isLoggedIn, (req, res, next) => {
  req.logout((err) => {
    if (err) {
      logger.error(err);
      console.error(err);
      next(err);
    } else {
      req.session.destroy();
      res.status(200).json({ success: true, msg: "logged out successfully" });
    }
  });
})

// check
router.get("/check", (req, res) => {
  if (req.user) res.json({ msg: "logged in" });
  else res.json({ msg: "not logged in" });
});


module.exports = router;