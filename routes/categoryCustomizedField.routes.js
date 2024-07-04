const {
  createCategoryCustomizedField,
  getAllCustomizeFields,
  deleteCategoryCustomizedFieldById,
} = require("../controllers/categoryCustomizedField.controllers.js");

const categoryCustomizedRoute = require("express").Router();
const upload = require("multer")();

categoryCustomizedRoute.post("/create", createCategoryCustomizedField);
categoryCustomizedRoute.get("/", getAllCustomizeFields);
categoryCustomizedRoute.delete(
  "/:customizedId",
  deleteCategoryCustomizedFieldById
);

module.exports = { categoryCustomizedRoute };
