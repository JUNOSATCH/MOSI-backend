// import libraries
const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const passport = require("passport");
const logger = require("./config/logger");
const cors = require("cors");

// import files
const authRouter = require("./routes/auth");
const teachersRouter = require("./routes/teachers");
const callRouter = require("./routes/call");
const passportConfig = require("./passport/index");

// config
dotenv.config();
passportConfig();

// create app
const app = express();

// app settings
app.set("port", process.env.PORT || 8080);

// middlewares
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: process.env.COOKIE_SECRET,
  cookie: {
    httpOnly: true,
    secure: false
  }
}));
app.use(passport.initialize());
app.use(passport.session());

// routers
app.use("/auth", authRouter);
app.use("/teachers", teachersRouter);
app.use("/call", callRouter);

app.use((req, res) => {
  const err = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  res.status(404).json(err);
});

app.use((err, req, res, next) => {
  logger.error(err);
  console.error(err);
  res.status(500).json(err);
});

// app listening
app.listen(app.get("port"), (req, res) => {
  logger.info(`Server running on PORT ${app.get("port")}...`);
  console.log(`Server running on PORT ${app.get("port")}...`);
});