const { users } = require("../models/userModel.js");
const { wishlists } = require("../models/wishListModel");
const { carts } = require("../models/cartModel");

const getAllUsers = async (req, res) => {
  try {
    const usersList = await users.aggregate([
      {
        $project: {
          password: 0,
          productsBought: 0,
          billingAddressIds: 0,
          shippingAddressIds: 0,
          passwordResetToken: 0,
          googleId: 0,
        },
      },
      {
        $addFields: {
          roleOrder: {
            $cond: { if: { $eq: ["$role", "admin"] }, then: 1, else: 2 },
          },
        },
      },
      {
        $sort: { roleOrder: 1 },
      },
      {
        $project: { roleOrder: 0 },
      },
    ]);

    res.json({ success: true, users: usersList });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Something went wrong!" });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Find the user by ID
    const user = await users.findById(userId);

    // If the user does not exist, return a 404 response
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Toggle the admin status
    const newStatus = !user.isAdmin;
    const newRole = newStatus ? "admin" : "user";

    // Update the user's role and admin status
    await users.findByIdAndUpdate(userId, {
      $set: {
        isAdmin: newStatus,
        role: newRole,
      },
    });

    // Return a success response
    res.json({
      success: true,
      message: newStatus ? "User is now an admin" : "User removed as admin",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Something went wrong!" });
  }
};


const blockStatus = async (req, res) => {
  try {
    const userId = req.params.userId;
    const status = await users.findById(userId).then((user) => {
      return user.isBlocked;
    });
    await users
      .findByIdAndUpdate(userId, { isBlocked: !status })
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
