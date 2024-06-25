const { default: mongoose } = require("mongoose");

const blogCategoryModel = new mongoose.Schema({
  name: String,
  description: String,
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  type: String,
  updatedAt: {
    type: Date,
    default: Date.now(),
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
  },
  slug: {
    type: String,
    required: true,
    unique: true,
  },
});

blogCategoryModel.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const categories = mongoose.model("categories", blogCategoryModel);

module.exports = {
  categories,
};
