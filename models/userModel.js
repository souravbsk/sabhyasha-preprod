const { default: mongoose } = require("mongoose");

const userModel = new mongoose.Schema({
  displayName: String,
  password: String,
  email: String,
  avatar: String,
  mobile: String,
  isAdmin: {
    type: Boolean,
    default: false,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  username: String,
  googleId: String,
  otp: String,
  billingAddressIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "addresses",
    },
  ],
  shippingAddressIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "addresses",
    },
  ],
  productsBought: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
  ],
  passwordResetToken: String,
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

const users = mongoose.model("users", userModel, "users");

module.exports = {
  users,
};
