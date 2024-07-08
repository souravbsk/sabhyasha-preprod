import { users } from "../models/userModel";

const isUserBlocked = async (req, res, next) => {
  try {
    const isBlocked = await users.findById(req.decoded.id).then((user) => {
      return user.isBlocked;
    });
    if (isBlocked) {
      return res
        .status(403)
        .json({ success: false, message: "You are blocked by admin" });
    } else {
      next();
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Something went wrong!" });
  }
};

module.exports = { isUserBlocked };
