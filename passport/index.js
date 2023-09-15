const passport = require("passport");
const db = require("../config/database");
const local = require("./LocalStrategy");

module.exports = () => {
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  passport.deserializeUser(async (id, done) => {
    const result = await db.query(`select * from users where id=?;`, [id]);
    const user = result[0][0];
    if (user) done(null, user);
    else done({ err: "AUTH ERROR: user not exists" });
  });

  local();
}