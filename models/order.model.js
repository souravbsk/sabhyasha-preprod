const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true, // Index for faster queries
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true, // Index for user-based queries
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      discountPrice: {
        type: Number,
        default: 0.0,
      },
    },
  ],
  paymentInfo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PaymentTransaction",
    required: true,
  },
  billingAddress: {
    country: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    address: { type: String, required: true },
    apartment: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    mobile: { type: String, required: true },
  },
  shippingAddress: {
    country: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    address: { type: String, required: true },
    apartment: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    mobile: { type: String, required: true },
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  discountAmount: {
    type: Number,
    default: 0.0,
  },
  status: {
    type: String,
    required: true,
    enum: ["Pending", "Confirmed", "Shipped", "Delivered", "Cancelled", "Refunded"],
    index: true, // Index for order status queries
  },
  orderDate: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  trackingNumber: {
    type: String,
    unique: true,
    sparse: true, // Sparse index, not all orders may have a tracking number
  },
});

// Middleware to automatically update the `updatedAt` field
orderSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for compound queries involving userId and order status
orderSchema.index({ userId: 1, status: 1 });

const Order = mongoose.model("Order", orderSchema);

module.exports = { Order };
