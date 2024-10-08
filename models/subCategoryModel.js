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
    ref: "productCategory",
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },

  created_by: {
    type: String,
    ref: "users",
  },

  updated_by: {
    type: String,
    ref: "users",
  },
});

subCategoryModel.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const SubCategory = mongoose.model(
  "productSubCategory",
  subCategoryModel,
  "productSubCategory"
);

module.exports = { SubCategory };
