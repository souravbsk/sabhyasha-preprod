const mongoose = require("mongoose");

const paymentTransactionSchema = new mongoose.Schema({
  txnid: {
    type: String,
    required: true,
    unique: true,
    index: true, // Index for faster queries
  },

  orderid: {
    type: String,
    unique: true,
    index: true, // Index for faster queries
  },

  mihpayid: {
    type: String,
    sparse: true, // Allow multiple null values
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
  },
  status: {
    type: String,
    enum: ["pending", "success", "failed", "refunded", "failure"], // Includes additional possible status
    index: true, // Index for faster queries
    set: (v) => v.toLowerCase(),
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
  },
  meCode: {
    type: String,
  },
  addedon: {
    type: Date,
  },
  hash: {
    type: String,
    required: true,
  },
  payment_source: {
    type: String,
  },
  PG_TYPE: {
    type: String,
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
  cardCategory: {
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
paymentTransactionSchema.index({ mihpayid: 1, status: 1 }, { sparse: true });

const PaymentTransaction = mongoose.model(
  "paymentTransaction",
  paymentTransactionSchema,
  "paymentTransaction"
);

module.exports = { PaymentTransaction };
