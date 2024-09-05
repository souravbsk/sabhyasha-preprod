const mongoose = require("mongoose");

const orderShippingStatusSchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
    unique: true,
  },
});

const OrderShippingStatus = mongoose.model(
  "orderShippingStatus",
  orderShippingStatusSchema,
  "orderShippingStatus"
);

module.exports = OrderShippingStatus;
