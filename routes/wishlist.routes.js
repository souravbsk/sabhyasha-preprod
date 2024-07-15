const {
  getWishListProducts,
  toggleProductInWishList,
  removeById,
} = require("../controllers/wishList.controllers.js");
const { verifyJwt } = require("../middlewares/verifyJWT");

const wishListRouter = require("express").Router();

wishListRouter.put("/:productId", verifyJwt, toggleProductInWishList);
wishListRouter.get("/", verifyJwt, getWishListProducts);
wishListRouter.delete("/:productId", verifyJwt, removeById);

module.exports = { wishListRouter };
