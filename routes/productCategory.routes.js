const {
  createProductCategory,
  getAllProductCategories,
  updateProductCategoryById,
  deleteProductCategoryById,
  getAllProductCategoryById,
  getAllCategoryById,
  getAllCategoryForShop,
} = require("../controllers/productCategory.controllers.js");

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
productCategoryRoute.get("/:parentcategoryId", getAllProductCategoryById); 
productCategoryRoute.get("/parentCategory/:parentcategoryId", getAllCategoryById); 
productCategoryRoute.get("/user/productcategry", getAllCategoryForShop); 




module.exports = { productCategoryRoute };
