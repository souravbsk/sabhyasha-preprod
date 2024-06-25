const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["shipping", "billing"],
    required: true,
  },
  name: {
    type: String,
  },
  country: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
  },
  zip: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  updatedAt: {
    type: Date,
  },
});

// Pre-save hook to update the updatedAt field
addressSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Address = mongoose.model("Address", addressSchema);

module.exports = Address;
