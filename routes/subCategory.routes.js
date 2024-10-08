const {
  createSubCategory,
  getAllSubCategories,
  updateSubCategoryById,
  deleteSubCategoryById,
  getAllSubCategoryById,
} = require("../controllers/subCategory.controllers.js");
const { verifyAdmin } = require("../middlewares/verifyAdmin.js");
const { verifyJwt } = require("../middlewares/verifyJWT.js");

const productSubCategoryRoute = require("express").Router();
const upload = require("multer")();

productSubCategoryRoute.post(
  "/create",
  verifyJwt,
  verifyAdmin,
  upload.any(),
  createSubCategory
); // create blog category
productSubCategoryRoute.get("/", getAllSubCategories); // view all blogs
productSubCategoryRoute.put(
  "/:subcategoryId",
  verifyJwt,
  verifyAdmin,
  upload.any(),
  updateSubCategoryById
);
productSubCategoryRoute.delete(
  "/:subcategoryId",
  verifyJwt,
  verifyAdmin,
  deleteSubCategoryById
);
productSubCategoryRoute.get("/:categoryId", getAllSubCategoryById); // remove blog

module.exports = { productSubCategoryRoute };
