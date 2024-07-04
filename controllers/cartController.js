const { ObjectId } = require("mongodb");
const { carts } = require("../models/cartModel");
const { Product } = require("../models/productModel");

const addItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = new ObjectId(req.decoded.id);
    const isExist = await carts.findOne({ userId: userId });
    const product = await Product.findById(productId);
    if (isExist) {
      await carts.findOneAndUpdate(
        { userId: userId },
        {
          $push: {
            products: { productId: productId, quantity: 1 },
          },
          $set: {
            totalAmount: isExist.totalAmount + product.price,
          },
        }
      );
      res.status(200).send({ success: true, message: "Product added to cart" });
    } else {
      const cart = new carts({
        userId: userId,
        products: [{ productId: productId, quantity: 1 }],
        totalAmount: product.price,
      });
      await cart.save();
      res.status(200).send({ success: true, message: "Product added to cart" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: "Server error" });
  }
};

const getCartItems = async (req, res) => {
  try {
    const userId = new ObjectId(req.decoded.id);
    const userCart = [];
    const cart = await carts.findOne({ userId: userId });
    cart.products.forEach((item) => {
      userCart.push(item.productId.toString());
    });
    const cartProducts = [];
    const products = await Product.find({});
    products.forEach((product) => {
      if (userCart.includes(product._id.toString())) {
        cartProducts.push(product._doc);
      }
    });
    res.status(200).send({
      success: true,
      data: { cartData: cart._doc, products: cartProducts },
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: "Server error" });
  }
};

const updateItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { type } = req.body;
    const userId = new ObjectId(req.decoded.id);
    const product = await Product.findById(productId);
    const cart = await carts.findOne({ userId: userId });
    if (!cart) {
      return res
        .status(404)
        .send({ success: false, message: "Cart not found" });
    }

    const productIndex = cart.products.findIndex(
      (p) => p.productId.toString() === productId
    );

    if (productIndex === -1) {
      return res
        .status(404)
        .send({ success: false, message: "Product not found in cart" });
    }

    if (type === "+") {
      cart.products[productIndex].quantity += 1;
      cart.totalAmount += product.price;
    } else if (type === "-") {
      cart.products[productIndex].quantity -= 1;
      cart.totalAmount -= product.price;
      if (cart.products[productIndex].quantity <= 0) {
        cart.products.splice(productIndex, 1);
      }
    } else {
      return res
        .status(400)
        .send({ success: false, message: "Invalid request type" });
    }

    await cart.save();
    res.status(200).send({ success: true, message: "Cart updated", cart });
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: "Server error" });
  }
};

const removeItem = async (req, res) => {
  try {
    const productId = req.params.productId;
    const userId = new ObjectId(req.decoded.id);
    const cart = await carts.findOne({ userId: userId });

    if (!cart) {
      return res
        .status(404)
        .send({ success: false, message: "Cart not found" });
    }

    const productIndex = cart.products.findIndex(
      (p) => p.productId.toString() === productId
    );

    if (productIndex === -1) {
      return res
        .status(404)
        .send({ success: false, message: "Product not found in cart" });
    }

    const product = await Product.findById(productId);
    cart.totalAmount -= cart.products[productIndex].quantity * product.price;
    cart.products.splice(productIndex, 1);

    await cart.save();
    res
      .status(200)
      .send({ success: true, message: "Product removed from cart", cart });
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: "Server error" });
  }
};

module.exports = {
  addItem,
  getCartItems,
  updateItem,
  removeItem,
};
