const { productParentCategory } = require("../models/parentCategoryModel");
const { ObjectId } = require("mongodb");
const { carts } = require("../models/cartModel");
const { Product } = require("../models/productModel");

// Toggle Item (Add/Remove)
const toggleItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = new ObjectId(req.decoded.id);
    const cart = await carts.findOne({ userId: userId });
    const product = await Product.findById(productId);

    if (!product) {
      return res
        .status(404)
        .send({ success: false, message: "Product not found" });
    }

    if (cart) {
      const productIndex = cart.products.findIndex(
        (p) => p.productId.toString() === productId
      );

      if (productIndex > -1) {
        cart.totalAmount -=
          cart.products[productIndex].quantity * product.price;
        cart.products.splice(productIndex, 1);
        await cart.save();
        return res
          .status(200)
          .send({ success: true, message: "Product removed from cart" });
      } else {
        cart.products.push({ productId: productId, quantity: 1 });
        cart.totalAmount += product.price;
        await cart.save();
        return res
          .status(200)
          .send({ success: true, message: "Product added to cart" });
      }
    } else {
      const newCart = new carts({
        userId: userId,
        products: [{ productId: productId, quantity: 1 }],
        totalAmount: product.price,
      });
      await newCart.save();
      return res
        .status(200)
        .send({ success: true, message: "Product added to cart" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: "Server error" });
  }
};

// Update Quantity
const updateItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { type } = req.body;
    const userId = new ObjectId(req.decoded.id);

    // First, check if the product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .send({ success: false, message: "Product not found" });
    }

    if (type === "+") {
      // Increment quantity or add new product
      const result = await Cart.updateOne(
        { userId: userId },
        {
          $inc: { totalAmount: product.price },
          $push: {
            $cond: [
              { $not: [{ $in: [productId, "$products.productId"] }] },
              { products: { productId: productId, quantity: 1 } },
              [],
            ],
          },
          $inc: {
            "products.$[elem].quantity": 1,
          },
        },
        {
          arrayFilters: [{ "elem.productId": productId }],
          upsert: true,
        }
      );

      if (result.upsertedCount > 0) {
        return res
          .status(200)
          .send({ success: true, message: "Product added to new cart" });
      }
    } else if (type === "-") {
      // Decrement quantity or remove product
      const result = await Cart.findOneAndUpdate(
        { userId: userId, "products.productId": productId },
        {
          $inc: { totalAmount: -product.price },
          $set: {
            "products.$[elem].quantity": {
              $cond: [
                { $gt: ["$products.$[elem].quantity", 1] },
                { $subtract: ["$products.$[elem].quantity", 1] },
                "$$REMOVE",
              ],
            },
          },
        },
        {
          arrayFilters: [{ "elem.productId": productId }],
          new: true,
        }
      );

      if (!result) {
        return res
          .status(404)
          .send({ success: false, message: "Product not found in cart" });
      }

      // Check if the cart is empty and delete if necessary
      if (result.products.length === 0) {
        await Cart.deleteOne({ userId: userId });
        return res
          .status(200)
          .send({ success: true, message: "Cart deleted as it became empty" });
      }
    } else {
      return res
        .status(400)
        .send({ success: false, message: "Invalid request type" });
    }

    res.status(200).send({ success: true, message: "Cart updated" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: "Server error" });
  }
};

// Get Cart Items
const getCartItems = async (req, res) => {
  try {
    const userId = new ObjectId(req.decoded.id);
    const cart = await carts.findOne({ userId: userId });

    if (!cart) {
      return res.status(200).send({
        success: true,
        data: [],
      });
    }

    const userCart = cart.products.map((item) => item.productId);
    const cartProducts = await Product.find({ _id: { $in: userCart } }).lean();

    const parentCategories = await productParentCategory.find({}).lean();
    const parentCategoryMap = parentCategories.reduce((map, category) => {
      map[category._id] = category.name;
      return map;
    }, {});

    const response = cartProducts.map((product) => {
      const productInCart = cart.products.find(
        (item) => item.productId.toString() === product._id.toString()
      );

      return {
        _id: product._id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        discountPrice: (product.discount / 100) * product.price,
        img: product.image ? product.image.imageUrl : null,
        quantity: productInCart.quantity,
        parentCategoryName: parentCategoryMap[product.parent_category_id] || "",
      };
    });

    res.status(200).send({
      success: true,
      data: { items: response, totalAmount: cart.totalAmount },
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: "Server error" });
  }
};

// Remove Product By ID
const removeProductById = async (req, res) => {
  try {
    const { productId } = req.params;
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

    cart.totalAmount -=
      cart.products[productIndex].quantity * cart.products[productIndex].price;
    cart.products.splice(productIndex, 1);

    if (cart.products.length === 0) {
      await carts.findOneAndDelete({ userId: userId });
      return res
        .status(200)
        .send({ success: true, message: "Cart deleted as it became empty" });
    }

    await cart.save();
    res
      .status(200)
      .send({ success: true, message: "Product removed from cart" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: "Server error" });
  }
};

// Clear Cart
const clearCart = async (req, res) => {
  try {
    const userId = new ObjectId(req.decoded.id);
    await carts.deleteOne({ userId: userId });
    res.status(200).send({ success: true, message: "Cart cleared!" });
  } catch (error) {
    console.log(error);
    res.status(500).send({ success: false, message: "Server error" });
  }
};

module.exports = {
  toggleItem,
  updateItem,
  getCartItems,
  removeProductById,
  clearCart,
};
