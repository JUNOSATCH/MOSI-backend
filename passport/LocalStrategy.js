const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");

const db = require("../config/database");
const logger = require("../config/logger");


module.exports = () => {
  passport.use(new LocalStrategy(
    {
      usernameField: "id",
      passwordField: "password",
    },
    async (email, password, done) => {
      try {
        const result = await db.query("select * from users where email=?", [email]);
        const user = result[0][0];
        if (user) {
          const result = await bcrypt.compare(password, user.password);
          if (result) done(null, user);
          else done(null, false, { msg: "password incorrect" });
        }
        else { done(null, false, { msg: "user not exists" }); }
      } catch (err) {
        logger.error(err);
        console.error(err);
        done(err);
      }
    }
  ));
}