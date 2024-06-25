const { default: mongoose } = require("mongoose");

const blogCommentModel = new mongoose.Schema({
  comment: String,
  status: String,
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  updatedAt: {
    type: Date,
    default: Date.now(),
  },
  blogId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "blogs",
  },
});

blogCommentModel.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const blogComments = mongoose.model(
  "blogComments",
  blogCommentModel,
  "blogComments"
);

module.exports = {
  blogComments,
};
