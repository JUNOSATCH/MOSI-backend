// import libraries
const express = require("express");
const dotenv = require("dotenv");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const cors = require("cors");

// import files
const apiRouter = require("./routes/api");
const dialogueRouter = require("./routes/dialogue");

// config
dotenv.config();

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

// routers
app.use("/api", apiRouter);
app.use("/dialogue", dialogueRouter);

app.use((req, res) => {
  const err = new Error(`${req.method} ${req.url} 라우터가 없습니다.`);
  res.status(404).json(err);
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json(err);
});

// app listening
app.listen(app.get("port"), (req, res) => {
  console.log(`Server running on PORT ${app.get("port")}...`);
});