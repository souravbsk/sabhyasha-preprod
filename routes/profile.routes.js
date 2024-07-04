const {
  getProfile,
  updateProfile,
  updatePassword,
} = require("../controllers/profile.controllers.js");
const { verifyJwt } = require("../middlewares/verifyJWT");

const profileRouter = require("express").Router();
const upload = require("multer")();

profileRouter.get("/:userId", getProfile);
profileRouter.put("/:userId", upload.any(), updateProfile);
profileRouter.patch("/change-password", verifyJwt, updatePassword);

module.exports = { profileRouter };
