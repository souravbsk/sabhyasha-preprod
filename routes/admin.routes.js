const {
  getAllUsers,
  promoteUser,
  demoteUser,
  blockUser,
  unblockUser,
  viewUser,
  deleteUser,
} = require("../controllers/admin.controllers");
const adminRouter = require("express").Router();

adminRouter.get("/users", getAllUsers);
adminRouter.get("/user/:userId", viewUser);
adminRouter.delete("/user/:userId", deleteUser);
adminRouter.post("/promote/:userId", promoteUser);
adminRouter.put("/demote/:userId", demoteUser);
adminRouter.post("/block/:userId", blockUser);
adminRouter.put("/unblock/:userId", unblockUser);

module.exports = { adminRouter };
