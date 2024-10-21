const {
  createBlog,
  getAllBlogs,
  getBlogsByCategory,
  viewBlog,
  removeBlog,
  updateBlogById,
  getBlogById,
  getBlogByCategory,
  testRoute,
} = require("../controllers/blog.controllers.js");
const { verifyAdmin } = require("../middlewares/verifyAdmin.js");
const { verifyJwt } = require("../middlewares/verifyJWT.js");

const blogRoute = require("express").Router();
const upload = require("multer")();

blogRoute.post("/create", verifyJwt, verifyAdmin, upload.any(), createBlog); // create blog
blogRoute.get("/", getAllBlogs); // view all blogs
blogRoute.get("/category/:slug", getBlogByCategory); // get blogs by category
blogRoute.get("/:slug", getBlogById); // get blog by slug
blogRoute.put("/:blogId", verifyJwt, verifyAdmin, upload.any(), updateBlogById); // update blog
blogRoute.delete("/:blogId", verifyJwt, verifyAdmin, removeBlog); // remove blog
blogRoute.get("/testblog/api/route",testRoute); // remove blog

module.exports = { blogRoute };
