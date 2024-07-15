const { default: mongoose } = require("mongoose");

const notifyProductModel = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
  },
  productIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "products",
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

notifyProductModel.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const notifications = mongoose.model("notifications", notifyProductModel);

module.exports = { notifications };
