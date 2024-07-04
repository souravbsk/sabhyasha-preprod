const jwt = require("jsonwebtoken");
require("dotenv").config("../.env");

const generateJWT = async (userId, email) => {
  return jwt.sign(
    {
      userId: userId,
      email: email,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "20m" }
  );
};

module.exports = {
  generateJWT,
};
