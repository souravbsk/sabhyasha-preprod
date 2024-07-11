const { default: mongoose } = require("mongoose");

const parentCategoryModel = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  image: String,
  updatedAt: {
    type: Date,
    default: Date.now(),
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
  },
  categories: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductCategory",
    },
  ],
  slug: {
    type: String,
    required: true,
    unique: true,
  },
});

parentCategoryModel.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const productParentCategory = mongoose.model(
  "productParentCategory",
  parentCategoryModel,
  "productParentCategory"
);

module.exports = { productParentCategory };
