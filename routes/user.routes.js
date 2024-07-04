const passport = require("passport");
const { verifyJwt } = require("../middlewares/verifyJWT.js");
const {
  registerUser,
  loginUser,
  googleLoginCallback,
  logoutUser,
  checkAuth,
  forgotPassword,
  sendOtpToRegisteredUser,
  verifyRegisteredUserOtp,
  sendOtpToAnyUser,
  veriyAnyOtp,
  resetPassword,
} = require("../controllers/userController.js");

const userAuth = require("express").Router();
const upload = require("multer")();
userAuth.post("/register", registerUser);
userAuth.post("/login", loginUser);
userAuth.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
userAuth.get(
  "/google/callback",
  passport.authenticate("google"),
  googleLoginCallback
);

userAuth.post("/logout", logoutUser);
userAuth.get("/checkAuth", verifyJwt, checkAuth);

// resetting password

// forgot password
userAuth.post("/forgot-password", forgotPassword);
userAuth.post("/reset-password", resetPassword);

// otp routes
userAuth.post("/registered/get-otp", sendOtpToRegisteredUser);
userAuth.post("/registered/verify-otp", verifyRegisteredUserOtp);
userAuth.post("/get-otp", sendOtpToAnyUser);
userAuth.post("/verify-otp", veriyAnyOtp);

module.exports = { userAuth };
