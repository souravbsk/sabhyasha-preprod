const { users } = require("../models/userModel.js");
const { wishlists } = require("../models/wishListModel");
const { carts } = require("../models/cartModel");

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

const updateUserRole = async (req, res) => {
  try {
    const userId = req.params.userId;
    const status = await users.findById(userId).then((user) => {
      return user.isAdmin;
    });
    await users
      .findByIdAndUpdate(req.params.userId, {
        $set: {
          isAdmin: !status,
          role: !status ? "admin" : "user",
        },
      })
      .catch((err) => {
        console.log(err);
        res
          .status(500)
          .json({ success: false, message: "Something went wrong!" });
      });
    res.json({
      success: true,
      message: !status ? "User is now an admin" : "User removed as admin",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Something went wrong!" });
  }
};

const blockStatus = async (req, res) => {
  try {
    const status = await users.findById(req.params.userId).then((user) => {
      return user.isBlocked;
    });
    await users
      .findByIdAndUpdate(req.params.userId, { isBlocked: !status })
      .catch((err) => {
        console.log(err);
        res
          .status(500)
          .json({ success: false, message: "Something went wrong!" });
      });
    res.json({
      success: true,
      message: !status ? "User is now blocked" : "User is now unblocked",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Something went wrong!" });
  }
};

const viewUserById = async (req, res) => {
  try {
    const user = await users.findById(req.params.userId).catch((err) => {
      console.log(err);
      res
        .status(500)
        .json({ success: false, message: "Something went wrong!" });
    });
    res.json({ success: true, user: user._doc });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Something went wrong!" });
  }
};

const deleteUser = async (req, res) => {
  try {
    await users.findByIdAndDelete(req.params.userId).catch((err) => {
      console.log(err);
      res
        .status(500)
        .json({ success: false, message: "Something went wrong!" });
    });
    await carts.findOneAndDelete({ userId: req.params.userId }).catch((err) => {
      console.log(err);
      res
        .status(500)
        .json({ success: false, message: "Something went wrong!" });
    });
    await wishlists
      .findOneAndDelete({ userId: req.params.userId })
      .catch((err) => {
        console.log(err);
        res
          .status(500)
          .json({ success: false, message: "Something went wrong!" });
      });
    res.json({ success: true, message: "User is now deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Something went wrong!" });
  }
};

module.exports = {
  getAllUsers,
  updateUserRole,
  blockStatus,
  viewUserById,
  deleteUser,
};
