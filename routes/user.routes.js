const passport = require("passport");
const { verifyJwt } = require("../middlewares/verifyJWT.js");
const {
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
} = require("../controllers/UserController.js");

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
userAuth.put("/changepassword", verifyJwt, updatePassword);

// forgot password
userAuth.post("/forgotpassword", forgotPassword);

// otp routes
userAuth.post("/registered/getotp", sendOtpToRegisteredUser);
userAuth.post("/registered/verifyotp", verifyRegisteredUserOtp);
userAuth.post("/getotp", sendOtpToAnyUser);
userAuth.post("/verifyotp", veriyAnyOtp);

module.exports = { userAuth };
