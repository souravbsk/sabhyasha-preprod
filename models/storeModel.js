const { default: mongoose } = require("mongoose");

const storeModel = new mongoose.Schema({
  name: String,
  address: {
    city: String,
    state: String,
    country: String,
    zip: String,
    addressLine: String,
  },
  mobileNumber: String,
  authorEmail: String,
  shops: [],
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  updatedAt: {
    type: Date,
    default: Date.now(),
  },
  slug: String,
});

storeModel.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Stores = mongoose.model("stores", storeModel,"stores");

module.exports = {
    Stores,
};
