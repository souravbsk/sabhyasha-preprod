const {
  getCartItems,
  updateItem,
  toggleItem,
} = require("../controllers/cart.controllers.js");
const { verifyJwt } = require("../middlewares/verifyJWT");

const cartRouter = require("express").Router();

cartRouter.post("/:productId", verifyJwt, toggleItem); // done
cartRouter.get("/", getCartItems); // done
cartRouter.put("/:productId", verifyJwt, updateItem); // done

module.exports = { cartRouter };
