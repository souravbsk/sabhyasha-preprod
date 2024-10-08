const {
  createParentCategory,
  getAllParentCategories,
  updateParentCategoryById,
  deleteParentCategoryById,
} = require("../controllers/productParent.controllers.js");
const { verifyAdmin } = require("../middlewares/verifyAdmin.js");
const { verifyJwt } = require("../middlewares/verifyJWT.js");

const parentCategoryRoute = require("express").Router();
const upload = require("multer")();

parentCategoryRoute.post(
  "/create",
  verifyJwt,
  verifyAdmin,
  upload.any(),
  createParentCategory
); // create parent category category
parentCategoryRoute.get("/", getAllParentCategories); // view all parent category
parentCategoryRoute.put(
  "/:categoryId",
  verifyJwt,
  verifyAdmin,
  upload.any(),
  updateParentCategoryById
); // get parent category by category
// parentCategoryRoute.put("/:categoryId", updateCategoryById); // get parent category by slug
parentCategoryRoute.delete(
  "/:categoryId",
  verifyJwt,
  verifyAdmin,
  deleteParentCategoryById
); // remove parent category

module.exports = { parentCategoryRoute };
