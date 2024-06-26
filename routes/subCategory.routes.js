const {
  createSubCategory,
  getAllSubCategories,
  updateSubCategoryById,
  deleteSubCategoryById,
  getAllSubCategoryById,
} = require("../controllers/subCategoryController");

const productSubCategoryRoute = require("express").Router();
const upload = require("multer")();

productSubCategoryRoute.post("/create", upload.any(), createSubCategory); // create blog category
productSubCategoryRoute.get("/", getAllSubCategories); // view all blogs
productSubCategoryRoute.put(
  "/:subcategoryId",
  upload.any(),
  updateSubCategoryById
);
productSubCategoryRoute.delete("/:subcategoryId", deleteSubCategoryById);
productSubCategoryRoute.get("/:categoryId", getAllSubCategoryById); // remove blog

module.exports = { productSubCategoryRoute };
