const { default: mongoose } = require("mongoose");

const blogModel = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  featureImage: {
    imageUrl: String,
    featureImgAlt: String,
    featureImageDescription: String,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  updatedAt: {
    type: Date,
    default: Date.now(),
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "blogCategories",
  },
  tags: [String],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
  },
  slug: String,
});

blogModel.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const blogs = mongoose.model("blogs", blogModel);

module.exports = {
  blogs,
};
