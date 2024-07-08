const verifyUser = async (req, res, next) => {
  const email = req.decoded?.email;
  const query = { email: email };
  const user = await userCollection.findOne(query);
  if (user?.role !== "user" ) {
    return res.status(403).send({ error: true, message: "forbidden request" });
  }
  next();
};

module.exports = {
  verifyUser,
};
