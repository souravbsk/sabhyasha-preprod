const { blogRoute } = require("./routes/blog.routes");
const { blogCategoryRoute } = require("./routes/blogCategory.routes");
const { blogCommentRoute } = require("./routes/blogComment.routes");
const {
  categoryCustomizedRoute,
} = require("./routes/categoryCustomizedField.routes");
const { couponRoute } = require("./routes/coupon.routes");
const { parentCategoryRoute } = require("./routes/parentCategory.routes");
const { productRoute } = require("./routes/product.routes");
const { productCategoryRoute } = require("./routes/productCategory.routes");
const { storeRoute } = require("./routes/store.routes");
const { productSubCategoryRoute } = require("./routes/subCategory.routes");
const { connectDB } = require("./utlis/connectDB");

const app = require("express")();
app.use(require("body-parser").json());
app.use(require("cors")());
require("dotenv").config();

connectDB();
app.get("/", (req, res) => {
  res.send("server revamp");
});
app.use("/api/blog", blogRoute);
app.use("/api/category", blogCategoryRoute);
app.use("/api/blogComment", blogCommentRoute);
app.use("/api/product/parentcategory", parentCategoryRoute);
app.use("/api/customized", categoryCustomizedRoute);
app.use("/api/product/category", productCategoryRoute);
app.use("/api/product/subcategory", productSubCategoryRoute);
app.use("/api/coupon", couponRoute);
app.use("/api/store", storeRoute);
app.use("/api", productRoute);
app.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running on port ${process.env.PORT || 3000}`);
});
