const {
  getAllUsers,
  deleteUser,
  viewUserById,
  updateUserRole,
  blockStatus,
  checkIsAdmin,
  checkIsUser,
} = require("../controllers/user.controllers.js");
const { verifyJwt } = require("../middlewares/verifyJWT.js");
const userRouter = require("express").Router();

userRouter.get("/admin/users", getAllUsers);
userRouter.get("/admin/:userId", viewUserById);
userRouter.delete("/admin/:userId", deleteUser);
userRouter.put("/admin/userrole/:userId", updateUserRole);
userRouter.put("/admin/blockstatus/:userId", blockStatus);

//is admin checker
userRouter.get("/admin/isAdminVerify/:email", verifyJwt, checkIsAdmin);
userRouter.get("/isUserVerify/:email", verifyJwt, checkIsUser);

module.exports = { userRouter };
