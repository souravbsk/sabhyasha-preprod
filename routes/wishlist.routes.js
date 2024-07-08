const {
  toogleProductInWishList,
  getWishListProducts,
} = require("../controllers/wishList.controllers.js");
const { verifyJwt } = require("../middlewares/verifyJWT");

const wishListRouter = require("express").Router();

wishListRouter.put("/:productId", verifyJwt, toogleProductInWishList);
wishListRouter.get("/", verifyJwt, getWishListProducts);

module.exports = { wishListRouter };
