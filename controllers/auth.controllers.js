const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const { ObjectId } = require("mongodb");
const { users } = require("../models/userModel.js");
const { generateOtp, sendMail } = require("../utlis/emailUtils.js");
const { generateJWT } = require("../utlis/generateJWT.js");
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
      isBlocked: false,
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

    const userEmail = decoded?.email;
    const userId = new ObjectId(decoded?.id);

    if (userEmail && userId) {
      const existingUser = await users.findOne(
        { email: userEmail, _id: userId },
        "email avatar username" // Specify fields to include
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

// forgot password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).send({ success: false, message: "Email is required!" });
      return;
    }

    const user = await users.findOne({ email });
    if (!user) {
      res.status(404).send({ success: false, message: "Email not registered" });
      return;
    }

    // Generate a unique token for password reset with a short expiry (e.g., 20 minutes)
    const token = await generateJWT(user._id, user.email);

    // Store the token in the user document
    user.passwordResetToken = token; // Assuming you have 'passwordResetToken' field in your user schema
    await user.save();

    // Construct the reset URL and email content
    const resetUrl = `${req.headers.origin}/reset-password/${token}`;
    const subject = "Password Reset Request";
    const body = {
      text: `Please click on the following link, or paste this into your browser to complete the process: ${resetUrl}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <p>Hello, ${user.displayName}</p>
          <p>You have requested a password reset. Please click the button below to reset your password:</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; font-size: 16px; color: #fff; background-color: #007bff; border-radius: 5px; text-decoration: none;">Reset Password</a>
          </p>
          <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
          <p>Best regards,<br />Sabhyasha Team</p>
        </div>
      `,
    };

    // Send the password reset email
    await sendMail(email, subject, body);

    res
      .status(200)
      .send({ success: true, message: "Password reset email sent!" });
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    res.status(500).send({ success: false, message: "Something went wrong!" });
  }
};

// reset password
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required!",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (err) {
      if (
        err.name === "JsonWebTokenError" ||
        err.name === "TokenExpiredError"
      ) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid or expired token!" });
      }
      throw err; // Rethrow other errors for generic handling
    }

    const user = await users.findById(decoded.userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found!" });
    }

    // Ensure token matches expected user
    if (decoded.email !== user.email) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid token for this user!" });
    }

    // Check if the token in the database matches the token provided
    if (user.passwordResetToken !== token) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired token!" });
    }

    // Update user's password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.passwordResetToken = null; // Clear the token after use
    await user.save();

    res
      .status(200)
      .json({ success: true, message: "Password reset successfully!" });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    res.status(500).json({ success: false, message: "Something went wrong!" });
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

// fsd
module.exports = {
  registerUser,
  loginUser,
  googleLoginCallback,
  logoutUser,
  checkAuth,
  forgotPassword,
  resetPassword,
  sendOtpToRegisteredUser,
  verifyRegisteredUserOtp,
  sendOtpToAnyUser,
  veriyAnyOtp,
};
