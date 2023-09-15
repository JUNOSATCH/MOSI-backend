const dotenv = require("dotenv");
const mysql = require("mysql2/promise");
const logger = require("./logger");


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
create table users (\
id int not null auto_increment,\
email varchar(40),\
nick varchar(15) not null,\
password varchar(100) not null,\
provider varchar(10) not null default 'local',\
snsId varchar(30),\
primary key (id)\
);\
";
    await db.query(query);

    logger.info("database initialized!");
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