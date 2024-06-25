const { blogRoute } = require("./routes/blog.routes");
const { blogCategoryRoute } = require("./routes/blogCategory.routes");
const { blogCommentRoute } = require("./routes/blogComment.routes");
const { parentCategoryRoute } = require("./routes/parentCategory.routes");
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
app.use("/api/blogCategory", blogCategoryRoute);
app.use("/api/blogComment", blogCommentRoute);
app.use("/api/product/parentcategory", parentCategoryRoute);
app.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running on port ${process.env.PORT || 3000}`);
});
