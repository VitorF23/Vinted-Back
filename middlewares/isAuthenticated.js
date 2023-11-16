const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  if (req.headers.authorization) {
    const userToken = req.headers.authorization.replace("Bearer ", "");

    const user = await User.findOne({ token: userToken }).select("account");

    if (!user) {
      return res.status(401).json("Unauthorized");
    } else {
      req.user = user;
      return next();
    }
  } else {
    return res.status(401).json("Unauthorized");
  }
};

module.exports = isAuthenticated;
