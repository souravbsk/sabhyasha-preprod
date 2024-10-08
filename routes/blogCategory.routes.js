const {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategoryById,
  deleteCategoryById,
} = require("../controllers/blogCategory.controllers.js");
const { verifyJwt } = require("../middlewares/verifyJWT.js");

const blogCategoryRoute = require("express").Router();
const upload = require("multer")();

blogCategoryRoute.post("/create", verifyJwt, upload.any(), createCategory); // create blog category
blogCategoryRoute.get("/", getAllCategories); // view all blogs
blogCategoryRoute.get("/:categoryId", getCategoryById); // get blogs by category
blogCategoryRoute.put("/:categoryId", verifyJwt, updateCategoryById); // get blog by slug
blogCategoryRoute.delete("/:categoryId", deleteCategoryById); // remove blog

module.exports = { blogCategoryRoute };
