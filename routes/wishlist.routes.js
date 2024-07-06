const {
  addProduct,
  getWishListProducts,
  removeProduct,
} = require("../controllers/wishList.controllers.js");
const { verifyJwt } = require("../middlewares/verifyJWT");

const wishListRouter = require("express").Router();

wishListRouter.post("/:productId", verifyJwt, addProduct);
wishListRouter.get("/", verifyJwt, getWishListProducts);
wishListRouter.delete("/:productId", verifyJwt, removeProduct);

module.exports = { wishListRouter };
