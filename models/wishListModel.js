const { default: mongoose } = require("mongoose");

const wishListModel = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
  },
  products: [
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

wishListModel.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const wishlists = mongoose.model("wishlists", wishListModel, "wishlists");

module.exports = {
  wishlists,
};
