const {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategoryById,
  deleteCategoryById,
} = require("../controllers/blogCategory.controllers.js");

const blogCategoryRoute = require("express").Router();
const upload = require("multer")();

blogCategoryRoute.post("/create", upload.any(), createCategory); // create blog category
blogCategoryRoute.get("/", getAllCategories); // view all blogs
blogCategoryRoute.get("/:categoryId", getCategoryById); // get blogs by category
blogCategoryRoute.put("/:categoryId", updateCategoryById); // get blog by slug
blogCategoryRoute.delete("/:categoryId", deleteCategoryById); // remove blog

module.exports = { blogCategoryRoute };
