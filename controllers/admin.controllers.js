const { users } = require("../models/userModel.js");

const getAllUsers = async (req, res) => {
  try {
    const usersList = await users.find({}).catch((err) => {
      console.log(err);
      res
        .status(500)
        .json({ success: false, message: "Something went wrong!" });
    });
    res.json({ success: true, users: usersList });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Something went wrong!" });
  }
};

const promoteUser = async (req, res) => {
  try {
    await users
      .findByIdAndUpdate(req.params.userId, { isAdmin: true })
      .catch((err) => {
        console.log(err);
        res
          .status(500)
          .json({ success: false, message: "Something went wrong!" });
      });
    res.json({ success: true, message: "User is now an admin" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Something went wrong!" });
  }
};

const demoteUser = async (req, res) => {
  try {
    await users
      .findByIdAndUpdate(req.params.userId, { isAdmin: false })
      .catch((err) => {
        console.log(err);
        res
          .status(500)
          .json({ success: false, message: "Something went wrong!" });
      });
    res.json({ success: true, message: "User is now an admin" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Something went wrong!" });
  }
};

const blockUser = async (req, res) => {
  try {
    await users
      .findByIdAndUpdate(req.params.userId, { isBlocked: true })
      .catch((err) => {
        console.log(err);
        res
          .status(500)
          .json({ success: false, message: "Something went wrong!" });
      });
    res.json({ success: true, message: "User is now blocked" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Something went wrong!" });
  }
};

const unblockUser = async (req, res) => {
  try {
    await users
      .findByIdAndUpdate(req.params.userId, { isBlocked: false })
      .catch((err) => {
        console.log(err);
        res
          .status(500)
          .json({ success: false, message: "Something went wrong!" });
      });
    res.json({ success: true, message: "User is now unblocked" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Something went wrong!" });
  }
};

module.exports = {
  getAllUsers,
  promoteUser,
  demoteUser,
  blockUser,
  unblockUser,
};
