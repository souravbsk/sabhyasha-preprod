const jwt = require("jsonwebtoken");
require("dotenv").config({ path: "../.env" });

const verifyJWT = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).send({ success: false, message: "Auth failed" });
  }
};

module.exports = { verifyJWT };
