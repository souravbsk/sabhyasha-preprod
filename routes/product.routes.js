const {
  createProduct,
  getAllProducts,
  quickUpdateProductById,
  bulkUploadProducts,
  deleteProductById,
} = require("../controllers/productController");

const productRoute = require("express").Router();
const upload = require("multer")();

productRoute.post(
  "/admin/products/bulk-upload",
  upload.any(),
  bulkUploadProducts
); // create blog category
productRoute.post("/product/create", upload.any(), createProduct); // create blog category
productRoute.get("/admin/products", getAllProducts); // view all blogs
productRoute.put(
  "/admin/product/quick-update/:productId",
  quickUpdateProductById
);

productRoute.delete("/admin/product/:productId", deleteProductById);
//   productCategoryRoute.get("/:parentcategoryId", getAllProductCategoryById); // remove blog

module.exports = { productRoute };
