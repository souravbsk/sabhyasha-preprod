const { shippingAddress } = require("../models/AddressModel");
const { users } = require("../models/userModel");
const { uploadToS3 } = require("../utlis/awsTools");
const bcrypt = require("bcryptjs");
const { ObjectId } = require("mongodb");

const getProfile = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return res
        .status(400)
        .send({ success: false, message: "User id is required" });
    }
    const user = await users.findById(userId).select('-password');;
    const shippingAdds = await shippingAddress.find({
      user: userId,
      type: "shipping",
    });
    const billingAdds = await shippingAddress.find({
      user: userId,
      type: "billing",
    });
    if (!user) {
      return res
        .status(404)
        .send({ success: false, message: "User not found" });
    }
    console.log(user);
    res.status(200).send({
      success: true,
      data: user,
      shippingAddresses: shippingAdds,
      billingAddresses: billingAdds,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: "Server error" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!userId) {
      return res
        .status(400)
        .send({ success: false, message: "User id is required" });
    }

    const { name, mobile } = req.body;
    req?.files?.length > 0 ? await uploadToS3("Profile")(req, res) : "";
    const oldUser = await users.findById(userId).select("-password");
    console.log(req?.fileUrls);

    const updatedUser = await users.findByIdAndUpdate(
      userId,
      {
        $set: {
          displayName: name || oldUser.displayName,
          mobile: mobile || oldUser.mobile,
          avatar: req?.fileUrls ? req?.fileUrls[0] : oldUser.avatar,
        },
      },
      {
        new: true,
      }
    );
    res.send({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: "Server error" });
  }
};

const updatePassword = async (req, res) => {
  try {
    console.log("first");
    console.log(req.body);
    const { new_password, old_password } = req.body;
    const { email, id } = req.decoded;

    const userId = new ObjectId(id);
    console.log(userId);
    const user = await users.findById(userId);

    // Check if user exists
    if (!user) {
      return res
        .status(404)
        .send({ success: false, message: "User not found" });
    }

    const isPasswordMatch = await bcrypt.compare(old_password, user?.password);

    // If passwords do not match, send an error message
    if (!isPasswordMatch) {
      return res
        .status(400)
        .send({ success: false, message: "Old password is incorrect" });
    }

    if (isPasswordMatch) {
      const hashedPassword = await bcrypt.hash(new_password, 10);
      await users
        .findByIdAndUpdate(userId, {
          $set: {
            password: hashedPassword,
          },
        })
        .catch((err) => {
          console.log(err);
          res
            .status(500)
            .send({ success: false, message: "Something went wrong!" });
        });
      res.status(200).send({ success: true, message: "Password updated" });
    } else {
      res
        .status(400)
        .send({ success: false, message: "Old password is incorrect" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: "Server error" });
  }
};

module.exports = { getProfile, updateProfile, updatePassword };
