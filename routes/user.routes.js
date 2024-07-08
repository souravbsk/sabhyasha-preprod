const {
  getAllUsers,
  deleteUser,
  viewUserById,
  updateUserRole,
  blockStatus,
} = require("../controllers/user.controllers.js");
const userRouter = require("express").Router();

userRouter.get("/admin/users", getAllUsers);
userRouter.get("/admin/:userId", viewUserById);
userRouter.delete("/admin/:userId", deleteUser);
userRouter.put("/admin/userrole/:userId", updateUserRole);
userRouter.put("/admin/blockstatus/:userId", blockStatus);

module.exports = { userRouter };
