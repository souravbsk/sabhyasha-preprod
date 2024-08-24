const {
  getCartItems,
  updateItem,
  toggleItem,
  clearCart,
  removeProductById,
  cartAmountUpdate,
} = require("../controllers/cart.controllers.js");
const { verifyJwt } = require("../middlewares/verifyJWT");

const cartRouter = require("express").Router();


cartRouter.put("/update_cart_amount", verifyJwt,cartAmountUpdate); // done
cartRouter.put("/:productId", verifyJwt, toggleItem); // done
cartRouter.get("/", verifyJwt, getCartItems); // done
cartRouter.put("/update/:productId", verifyJwt, updateItem); // done
cartRouter.delete("/:productId", verifyJwt, removeProductById); // done
cartRouter.delete("/", verifyJwt, clearCart); // done

module.exports = { cartRouter };
