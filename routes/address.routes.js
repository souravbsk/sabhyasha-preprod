const {
  addAddress,
  removeAddress,
} = require("../controllers/addressControllers");

const addressRouter = require("express").Router();

addressRouter.post("/:userId", addAddress);
addressRouter.delete("/:addressId", removeAddress);

module.exports = { addressRouter };
