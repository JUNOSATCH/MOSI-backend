const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) next();
  else res.json({ success: false, msg: "not logged in"});
}

const isNotLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) next();
  else res.json({ success: false, msg: "already logged in" });
}

module.exports = {
  isLoggedIn,
  isNotLoggedIn,
};
