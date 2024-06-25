const { default: mongoose } = require("mongoose");

const subCategoryModel = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  image: String,
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  updatedAt: {
    type: Date,
    default: Date.now(),
  },
  parentCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "productParentCategory",
    required: true,
  },
  productCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductCategory",
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
});

subCategoryModel.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const SubCategory = mongoose.model("SubCategory", subCategoryModel);

module.exports = { SubCategory };
