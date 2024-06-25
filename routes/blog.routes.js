const {
  createBlog,
  getAllBlogs,
  getBlogsByCategory,
  viewBlog,
  updateBlog,
  removeBlog,
} = require("../controllers/blogController");

const blogRoute = require("express").Router();
const upload = require("multer")();

blogRoute.post("/create", upload.any(), createBlog); // create blog
blogRoute.get("/", getAllBlogs); // view all blogs
blogRoute.get("/category/:slug", getBlogsByCategory); // get blogs by category
blogRoute.get("/:slug", viewBlog); // get blog by slug
blogRoute.put("/:blogId", upload.any(), updateBlog); // update blog
blogRoute.delete("/:blogId", removeBlog); // remove blog

module.exports = { blogRoute };
