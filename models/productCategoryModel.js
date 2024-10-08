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
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "customizedFileds",
      },
      name: String,
      isRequired: Boolean,
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

  slug: {
    type: String,
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

productCategoryModel.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const productCategory = mongoose.model(
  "productCategory",
  productCategoryModel,
  "productCategory"
);

module.exports = { productCategory };
