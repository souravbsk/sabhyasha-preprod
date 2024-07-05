const {
  addAddress,
  removeAddress,
} = require("../controllers/address.controllers.js");

const addressRouter = require("express").Router();

addressRouter.post("/create/:userId", addAddress);
addressRouter.delete("/:addressId", removeAddress);

module.exports = { addressRouter };
// fds