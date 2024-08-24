const mongoose = require('mongoose');

const orderStatusSchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
    unique: true,
  },
});

const OrderStatus = mongoose.model('OrderStatus', orderStatusSchema);

module.exports = OrderStatus;
