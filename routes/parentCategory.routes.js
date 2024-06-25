const {
  createParentCategory,
  getAllParentCategories,
  updateParentCategoryById,
  deleteParentCategoryById,
} = require("../controllers/productParentController");

const parentCategoryRoute = require("express").Router();
const upload = require("multer")();

parentCategoryRoute.post("/create", upload.any(), createParentCategory); // create blog category
parentCategoryRoute.get("/", getAllParentCategories); // view all blogs
parentCategoryRoute.put("/:categoryId", upload.any(), updateParentCategoryById); // get blogs by category
// parentCategoryRoute.put("/:categoryId", updateCategoryById); // get blog by slug
parentCategoryRoute.delete("/:categoryId", deleteParentCategoryById); // remove blog

module.exports = { parentCategoryRoute };
