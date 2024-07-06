const { ObjectId } = require("mongodb");
const { Product } = require("../models/productModel");
const { wishlists } = require("../models/wishListModel");

const addProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = new ObjectId(req.decoded.id);
    let wishlist = await wishlists.findOne({ userId });
    if (wishlist) {
      if (!wishlist.products.includes(productId)) {
        wishlist.products.push(productId);
      }
    } else {
      wishlist = new wishlists({
        userId,
        products: [productId],
      });
    }
    await wishlist.save();
    res
      .status(200)
      .send({ success: true, message: "Product added to wishlist!" });
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

const removeProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    const userId = new ObjectId(req.decoded.id);
    await wishlists.findOneAndUpdate(
      { userId: userId },
      { $pull: { products: productId } }
    );
    res.status(200).send({ success: true, message: "Product removed" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: "Server error" });
  }
};

module.exports = {
  addProduct,
  removeProduct,
  getWishListProducts,
};
