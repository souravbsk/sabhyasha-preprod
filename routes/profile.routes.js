const {
  getProfile,
  updateProfile,
} = require("../controllers/profileController");

const profileRouter = require("express").Router();
const upload = require("multer")();

profileRouter.get("/:userId", getProfile);
profileRouter.put("/:userId", upload.any(), updateProfile);

module.exports = { profileRouter };
