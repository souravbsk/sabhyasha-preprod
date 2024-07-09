const {
  getWishListProducts,
  toggleProductInWishList,
} = require("../controllers/wishList.controllers.js");
const { verifyJwt } = require("../middlewares/verifyJWT");

const wishListRouter = require("express").Router();

wishListRouter.put("/:productId", verifyJwt, toggleProductInWishList);
wishListRouter.get("/", verifyJwt, getWishListProducts);

module.exports = { wishListRouter };
