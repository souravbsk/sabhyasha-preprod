const {
  createBlogComment,
  getAllBlogComments,
  updateBlogCommentById,
  deleteCommentById,
} = require("../controllers/blogComment.controllers.js");

const blogCommentRoute = require("express").Router();
const upload = require("multer")();

blogCommentRoute.post("/create", upload.any(), createBlogComment); // create blog category
blogCommentRoute.get("/", getAllBlogComments); // view all blogs
blogCommentRoute.put("/:commentId", updateBlogCommentById); // get blogs by category
//   blogCommentRoute.put("/:categoryId", updateCategoryById); // get blog by slug
blogCommentRoute.delete("/:commentId", deleteCommentById); // remove blog

module.exports = { blogCommentRoute };
