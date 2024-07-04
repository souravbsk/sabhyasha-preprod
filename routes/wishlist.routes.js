const {
  addItem,
  getWishListItems,
  removeItem,
} = require("../controllers/wishListController");
const { verifyJwt } = require("../middlewares/verifyJWT");

const wishListRouter = require("express").Router();

wishListRouter.post("/:productId", verifyJwt, addItem);
wishListRouter.get("/", verifyJwt, getWishListItems);
wishListRouter.delete("/:productId", verifyJwt, removeItem);

module.exports = { wishListRouter };
