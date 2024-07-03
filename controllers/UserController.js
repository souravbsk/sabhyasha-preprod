const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const { ObjectId } = require("mongodb");
const { users } = require("../models/userModel");
const { generateOtp } = require("../utlis/nodeMailerSetup");
const { generateJWT } = require("../utlis/generateJWT");
require("dotenv").config();

const registerUser = async (req, res) => {
  console.log(req.body);
  const { email, password, displayName, role } = req.body;

  const username = email?.split("@")[0];
  console.log(username);

  try {
    // Check if the user already exists
    const existingUser = await users.findOne({ email: email });
    if (existingUser) {
      return res.status(400).send("Email already exists");
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new users({
      email: email,
      username: username,
      password: hashedPassword,
      displayName: displayName,
      isEmailVerify: false,
      role: role,
    });

    // Save the new user
    await newUser.save();
    console.log(newUser, "fsdafsad");

    // Generate a JWT token
    const token = jwt.sign(
      {
        email: newUser.email,
        id: newUser._id,
      },
      process.env.ACCESS_TOKEN_SECRET
    );

    // Respond with the new user and token
    res.json({ success: true, token: token });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error registering user");
  }
};

const loginUser = async (req, res, next) => {
  console.log(req.body, "fsdfsadf");
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      // If authentication fails, log unauthorized access attempt
      console.log(
        "Unauthorized access attempt:",
        req.body ? req.body.email : "Email not provided in request body"
      );
      // Send an error message
      return res.status(401).json({ success: false, message: info.message });
    }
    // If authentication succeeds, generate JWT token
    const token = jwt.sign(
      {
        email: user.email,
        id: user?._id,
      },
      process.env.ACCESS_TOKEN_SECRET
    );
    res.json({ success: true, token: token });
  })(req, res, next);
};

const googleLoginCallback = async (req, res) => {
  if (req.user) {
    const user = req.user;
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
      },
      process.env.ACCESS_TOKEN_SECRET
    );
    res.cookie("jwt-token", token);
    res.redirect("http://localhost:5173/store");
  } else {
    console.log("User authentication failed");
    res.redirect("http://localhost:5173/login");
  }
};

const logoutUser = (req, res) => {
  req.logout(function (err) {
    if (err) {
      console.log(err);
    } else {
      res.json({ success: true, message: "Logged out successfully" });
    }
  });
};

const checkAuth = async (req, res) => {
  try {
    const decoded = req.decoded;

    const email = decoded?.email;
    const userId = new ObjectId(decoded?.id);

    if (email && userId) {
      const existingUser = await users.findOne(
        { email: email, _id: userId },
        { projection: { password: 0 } } // Exclude the password field
      );

      if (existingUser) {
        res.status(200).json({ success: true, user: existingUser });
      } else {
        console.log("User not found");
        res.status(404).json({ success: false, message: "User not found" });
      }
    }
  } catch (error) {
    console.error("Error checking auth:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { new_password, old_password } = req.body;
    const userId = new ObjectId(decoded?.id);
    const user = await users.findById(userId);
    const isPasswordMatch = await bcrypt.compare(old_password, user.password);
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

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).send({ success: false, message: "Email is required!" });
      return;
    }
    const user = await users.findOne({ email: email }).catch((err) => {
      console.log(err);
      res
        .status(500)
        .send({ success: false, message: "Something went wrong!" });
    });
    if (!user) {
      res.status(404).send({ success: false, message: "mail not registered" });
      return;
    }
    const token = jwt.sign(
      {
        email: user.email,
        id: user?._id,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "20m" }
    );
    res
      .status(200)
      .send({ success: true, token: token, message: "session alloted!" });
  } catch (error) {
    console.log(error);
    res.send({ success: false, message: "Something went wrong!" });
  }
};

const sendOtpToRegisteredUser = async (req, res) => {
  try {
    const mail = req.body.email;
    if (!mail) {
      res.send({ success: false, message: "Email is required!" });
      return;
    }
    const user = await users.findOne({ email: mail });
    if (!user) {
      res.send({ success: false, message: "User not found!" });
      return;
    } else {
      const otp = await generateOtp(mail);
      console.log(otp);
      await users.findOneAndUpdate({ email: mail }, { otp: otp });
      res.send({ success: true });
    }
  } catch (error) {
    console.log(error);
    res.send({ success: false, message: "Something went wrong!" });
  }
};

const verifyRegisteredUserOtp = async (req, res) => {
  try {
    const { otpEntered, email } = req.body;
    if (!otpEntered || !email) {
      res.send({ success: false, message: "Email and otp is required!" });
      return;
    }
    const user = await users.findOne({ email: email });
    if (!user) {
      res.send({ success: false, message: "User not found!" });
      return;
    }
    if (user.otp === otpEntered) {
      res.send({ success: true, message: "Otp verified!" });
      await users.findOneAndUpdate({ email: email }, { otp: null });
    } else {
      res.send({ success: false, message: "Incorrect otp entered!" });
    }
  } catch (error) {
    console.log(error);
    res.send({ success: false, message: "Something went wrong!" });
  }
};

const sendOtpToAnyUser = async (req, res) => {
  try {
    const mail = req.body.email;
    if (!mail) {
      res.send({ success: false, message: "Email is required!" });
      return;
    }
    const otp = await generateOtp(mail);
    console.log(otp);
    res.send({ success: true, otp: otp });
  } catch (error) {
    console.log(error);
    res.send({ success: false, message: "Something went wrong!" });
  }
};

const veriyAnyOtp = async (req, res) => {
  try {
    const { otpEntered, otp } = req.body;
    if (!otpEntered || !otp) {
      res.send({ success: false, message: "Otp is required!" });
      return;
    }
    if (otp === otpEntered) {
      res.send({ success: true, message: "Otp verified!" });
    } else {
      res.send({ success: false, message: "Incorrect otp entered!" });
    }
  } catch (error) {
    console.log(error);
    res.send({ success: false, message: "Something went wrong!" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  googleLoginCallback,
  logoutUser,
  checkAuth,
  updatePassword,
  forgotPassword,
  sendOtpToRegisteredUser,
  verifyRegisteredUserOtp,
  sendOtpToAnyUser,
  veriyAnyOtp,
};
