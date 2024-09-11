const jwt = require("jsonwebtoken");

const verifyJwt = (req, res, next) => {
  const authorization = req.headers.authorization;
  console.log(authorization, "authorization");
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorized access" });
  }
  const token = authorization.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      error: true,
      message: "Unauthorized access. Invalid token format.",
    });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    console.log(decoded);
    if (err) {
      res.status(401).send({ error: true, message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};

module.exports = { verifyJwt };
