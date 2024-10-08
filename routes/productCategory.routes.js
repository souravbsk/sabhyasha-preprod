const {
  createProductCategory,
  getAllProductCategories,
  updateProductCategoryById,
  deleteProductCategoryById,
  getAllProductCategoryById,
  getAllCategoryById,
  getAllCategoryForShop,
} = require("../controllers/productCategory.controllers.js");
const { verifyAdmin } = require("../middlewares/verifyAdmin.js");
const { verifyJwt } = require("../middlewares/verifyJWT.js");

const productCategoryRoute = require("express").Router();
const upload = require("multer")();

productCategoryRoute.post(
  "/create",
  verifyJwt,
  verifyAdmin,
  upload.any(),
  createProductCategory
); // create blog category
productCategoryRoute.get("/", getAllProductCategories); // view all blogs
productCategoryRoute.put(
  "/:categoryId",
  verifyJwt,
  verifyAdmin,
  upload.any(),
  updateProductCategoryById
); // get blogs by category
productCategoryRoute.delete(
  "/:categoryId",
  verifyJwt,
  deleteProductCategoryById
);
productCategoryRoute.get("/:parentcategoryId", getAllProductCategoryById);
productCategoryRoute.get(
  "/parentCategory/:parentcategoryId",
  getAllCategoryById
);
productCategoryRoute.get("/user/productcategry", getAllCategoryForShop);

module.exports = { productCategoryRoute };
