const { default: mongoose } = require("mongoose");

const cartModel = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
  },
  products: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products",
      },
      quantity: Number,
    },
  ],
  totalAmount: Number,
  totalItems:Number,
  count:Number,
  priceWithDiscount:Number,
  shippingCharge:Number,
  checkOutAmount:Number,
  coupon: {
    type: mongoose.Schema.Types.Mixed, // Allows any type of object to be stored
  },
  
  couponAmount:Number,
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  updatedAt: {
    type: Date,
    default: Date.now(),
  },
});

cartModel.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const carts = mongoose.model("carts", cartModel, "carts");

module.exports = {
  carts,
};
