const {
  createProductCategory,
  getAllProductCategories,
  updateProductCategoryById,
  deleteProductCategoryById,
  getAllProductCategoryById,
} = require("../controllers/productCategoryController");

const productCategoryRoute = require("express").Router();
const upload = require("multer")();

productCategoryRoute.post("/create", upload.any(), createProductCategory); // create blog category
productCategoryRoute.get("/", getAllProductCategories); // view all blogs
productCategoryRoute.put(
  "/:categoryId",
  upload.any(),
  updateProductCategoryById
); // get blogs by category
productCategoryRoute.delete("/:categoryId", deleteProductCategoryById);
productCategoryRoute.get("/:parentcategoryId", getAllProductCategoryById); // remove blog

module.exports = { productCategoryRoute };
