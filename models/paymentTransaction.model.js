const mongoose = require("mongoose");

const paymentTransactionSchema = new mongoose.Schema({
  txnid: {
    type: String,
    required: true,
    unique: true,
    index: true, // Index for faster queries
  },
  mihpayid: {
    type: String,
    required: true,
    unique: true,
    index: true, // Index for faster queries
  },
  amount: {
    type: Number,
    required: true,
  },
  productinfo: {
    type: String,
    required: true,
  },
  firstname: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
  },
  email: {
    type: String,
    required: true,
    index: true, // Index for faster queries
  },
  phone: {
    type: String,
    required: true,
  },
  mode: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ["Pending", "Success", "Failed", "Refunded"], // Includes additional possible status
    index: true, // Index for faster queries
  },
  unmappedstatus: {
    type: String,
  },
  discount: {
    type: Number,
    default: 0.0,
  },
  net_amount_debit: {
    type: Number,
    required: true,
  },
  addedon: {
    type: Date,
    required: true,
  },
  hash: {
    type: String,
    required: true,
  },
  payment_source: {
    type: String,
    required: true,
  },
  PG_TYPE: {
    type: String,
    required: true,
  },
  bank_ref_num: {
    type: String,
  },
  bankcode: {
    type: String,
  },
  error: {
    type: String,
  },
  error_Message: {
    type: String,
  },
  cardnum: {
    type: String,
  },
  meCode: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware to automatically update the `updatedAt` field
paymentTransactionSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Define compound indexes for frequently queried fields together
paymentTransactionSchema.index({ txnid: 1, status: 1 });
paymentTransactionSchema.index({ mihpayid: 1, status: 1 });

const PaymentTransaction = mongoose.model(
  "PaymentTransaction",
  paymentTransactionSchema
);

module.exports = { PaymentTransaction };
