const { default: mongoose } = require("mongoose");

const productCategoryModel = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  image: String,
  isCustomizable: Boolean,
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  selectedFields: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customization",
    },
  ],
  updatedAt: {
    type: Date,
    default: Date.now(),
  },
  parentCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "productParentCategory",
    required: true,
  },
  subCategories: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubCategory",
    },
  ],
  slug: {
    type: String,
    required: true,
    unique: true,
  },
});

categoryModel.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const ProductCategory = mongoose.model("ProductCategory", productCategoryModel);

module.exports = { ProductCategory };
