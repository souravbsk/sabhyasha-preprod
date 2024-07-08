const { ObjectId } = require("mongodb");
const { Product } = require("../models/productModel");
const { wishlists } = require("../models/wishListModel");

// toggle : add or remove product from wishlist

const toogleProductInWishList = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = new ObjectId(req.decoded.id);
    let isWishlistExists = await wishlists.findOne({ userId });
    if (isWishlistExists) {
      if (isWishlistExists.products.includes(productId)) {
        await wishlists.findByIdAndUpdate(isWishlistExists._id, {
          $pull: { products: productId },
        });
        return res
          .status(200)
          .send({ success: true, message: "Product removed from wishlist!" });
      } else {
        isWishlistExists.products.push(productId);
        await isWishlistExists.save();
        return res
          .status(200)
          .send({ success: true, message: "Product added to wishlist!" });
      }
    } else {
      await wishlists.create({ userId: userId, products: [productId] });
      return res
        .status(200)
        .send({ success: true, message: "Product added to wishlist!" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: "Server error" });
  }
};

const getWishListProducts = async (req, res) => {
  try {
    const userId = new ObjectId(req.decoded.id);
    const userWishlist = await wishlists.findOne({ userId: userId });
    const wishlistProducts = (await Product.find({})).filter((product) => {
      return userWishlist.products.includes(product._id);
    });
    res.status(200).send({ success: true, data: wishlistProducts });
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: "Server error" });
  }
};

module.exports = {
  toogleProductInWishList,
  getWishListProducts,
};
