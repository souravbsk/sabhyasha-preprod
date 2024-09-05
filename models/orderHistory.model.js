const mongoose = require("mongoose");
const OrderShippingStatus = require("./orderShippingStatus.model");

const orderHistorySchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "order",
    required: true,
  },
  email: {
    type: String,
    required: true, // Ensure every order has an email
    index: true,
  },
  paymentTransactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "paymentTransaction",
    required: true,
  },
  shippingStatusId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "orderShippingStatus",
    required: true,
    index: true,
  },
  status: {},
  action: {},
  note: {},
});

const OrderHistory = mongoose.model(
  "orderHistory",
  orderHistorySchema,
  "orderHistory"
);

module.exports = OrderHistory;
