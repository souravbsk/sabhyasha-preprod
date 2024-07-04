const {
  addItem,
  getCartItems,
  updateItem,
  removeItem,
} = require("../controllers/cartController");
const { verifyJwt } = require("../middlewares/verifyJWT");

const cartRouter = require("express").Router();

cartRouter.post("/:productId", verifyJwt, addItem); // done
cartRouter.get("/", verifyJwt, getCartItems); // done
cartRouter.put("/:productId", verifyJwt, updateItem); // done
cartRouter.delete("/:productId", verifyJwt, removeItem); // done

module.exports = { cartRouter };
