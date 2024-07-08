const { users } = require("../models/userModel");

const verifyAdmin = async (req, res, next) => {
  const email = req?.decoded?.email;
  const query = { email: email };
  const user = await users.findOne(query, "email username isAdmin role");
  console.log(user)
  if (user?.role !== "admin" && !user.isAdmin) {
    return res.status(403).send({ error: true, message: "forbidden request" });
  }
  next();
};

module.exports = {
  verifyAdmin,
};
