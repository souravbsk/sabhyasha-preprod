const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const { ObjectId } = require("mongodb");
const { users } = require("../models/userModel");
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
    const { password } = req.body;
    const userId = new ObjectId(decoded?.id);
    const hashedPassword = await bcrypt.hash(password, 10);
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
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: "Server error" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  googleLoginCallback,
  logoutUser,
  checkAuth,
  updatePassword,
};
