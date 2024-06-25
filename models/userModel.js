const { default: mongoose } = require("mongoose");

const userModel = new mongoose.Schema({
  displayName: String,
  email: String,
  avatar: String,
  mobile: String,
  shippingAdresses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ShippingAddress",
    },
  ],
  productsBought: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
  ],
  cart: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
  ],
  wishList: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  updatedAt: {
    type: Date,
    default: Date.now(),
  },
});

userModel.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const User = mongoose.model("User", userModel);

module.exports = {
  User,
};
