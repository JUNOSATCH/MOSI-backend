const dotenv = require("dotenv");
const mysql = require("mysql2/promise");
// const logger = require("./logger");


dotenv.config();

const initDB = async () => {
  const db = mysql.createPool({
    host: "127.0.0.1",
    user: "root",
    password: process.env.DB_PASSWORD,
    multipleStatements: true
  });
  const result = await db.query(`show databases like '${process.env.DB_NAME}';`);
  const info = result[0][0];
  if (info === undefined) {
    const query = "\
create database " + process.env.DB_NAME + ";\
use " + process.env.DB_NAME + ";\
create table dialogues (\
id int not null auto_increment,\
username varchar(15) not null,\
dialogue varchar(1500),\
score int,\
primary key (id)\
);\
";
    await db.query(query);

    console.info("database initialized!");
  }
  await db.end();
}

initDB();
const db = mysql.createPool({
  host: "127.0.0.1",
  user: "root",
  password: process.env.DB_PASSWORD,
  multipleStatements: true,
  database: process.env.DB_NAME
});


module.exports = db;