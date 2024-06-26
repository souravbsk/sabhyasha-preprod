const { default: mongoose } = require("mongoose");
const { ObjectId } = require("mongodb");

const { slugGenerator } = require("../utlis/slugGenerate");
const { uploadToS3 } = require("../utlis/awsTools");
const { categories } = require("../models/blogCategoryModel");
const { default: slugify } = require("slugify");
const { blogs } = require("../models/blogModel");
const { blogComments } = require("../models/blogCommentModel");

const createBlog = async (req, res) => {
  console.log(req);
  try {
    const {
      title,
      description,
      author,
      category,
      tags,
      featureImgAlt,
      featureImageDescription,
    } = req.body;
    const tagsArray = tags ? tags.split(",") : [];
    const createdAt = new Date();
    const imageURLs = await uploadToS3("Blog")(req, res, async () => {
      try {
        const featureImage = {
          imageURL: req.fileUrls[0],
          featureImgAlt,
          featureImageDescription,
        };
        const existingSlugs = await blogs.find({}).distinct("slug");
        const generateSlugUrl = await slugGenerator(title, existingSlugs);

        console.log(featureImage, "hello");
        const newBlog = new blogs({
          title,
          description,
          // author: mongoose.Types.ObjectId(author),
          category,
          tags: tagsArray,
          featureImage,
          createdAt,
          slug: generateSlugUrl,
        });
        const savedBlog = await newBlog.save();

        if (!savedBlog) {
          return res.status(404).json({ error: "Blog post not found" });
        }
        console.log(savedBlog);

        return res.status(201).send({
          success: true,
          data: savedBlog,
        });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error });
      }
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllBlogs = async (req, res) => {
  try {
    console.log("first");

    const pipeline = [
      // Stage 1: $lookup to get parent category details
      {
        $lookup: {
          from: categories.collection.collectionName,
          let: { category: { $toObjectId: "$category" } },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$category"] },
              },
            },
          ],
          as: "blogCategory",
        },
      },
      // Stage 4: $sort
      {
        $sort: { createdAt: -1 },
      },
      // Stage 5: $project
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          author: 1,
          createdAt: 1,
          tags: 1,
          slug: 1,
          featureImage: 1,
          category: {
            $cond: {
              if: { $eq: [{ $size: "$blogCategory" }, 0] },
              then: null,
              else: {
                _id: { $arrayElemAt: ["$blogCategory._id", 0] },
                name: { $arrayElemAt: ["$blogCategory.name", 0] },
                slug: { $arrayElemAt: ["$blogCategory.slug", 0] },
                createdAt: { $arrayElemAt: ["$blogCategory.createdAt", 0] },
              },
            },
          },
        },
      },
    ];

    const blogsData = await blogs.aggregate(pipeline);

    res.status(200).json(blogsData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateBlogById = async (req, res) => {
  try {
    const blogId = req.params.blogId;
    const {
      title,
      slug,
      category,
      description,
      tags,
      author,
      featureImgAlt,
      featureImageDescription,
      image,
    } = req.body;
    const tagsArray = tags ? tags.split(",") : [];
    const updatedAt = new Date();

    let imageURL;
    if (image) {
      imageURL = image;
    } else {
      const imageURLs = await uploadToS3("Blog")(req, res);
      imageURL = req.fileUrls[0];
    }

    const updateFields = { updatedAt };
    if (title) updateFields.title = title;
    if (description) updateFields.description = description;
    if (author) updateFields.author = author;
    if (category) updateFields.category = category;
    if (tagsArray.length > 0) updateFields.tags = tagsArray;
    if (featureImgAlt)
      updateFields["featureImage.featureImgAlt"] = featureImgAlt;
    if (featureImageDescription)
      updateFields["featureImage.featureImageDescription"] =
        featureImageDescription;
    if (imageURL) updateFields["featureImage.imageURL"] = imageURL;

    if (slug) {
      const generateSlugUrl = await slugify(slug, {
        replacement: "-",
        lower: true,
        strict: false,
      });

      const existingBlog = await blogs.findOne({ slug: generateSlugUrl });
      if (existingBlog && existingBlog._id.toString() !== blogId) {
        return res
          .status(400)
          .json({ error: "Blog with the same slug already exists" });
      }
      updateFields.slug = generateSlugUrl;
    }

    const result = await blogs.findByIdAndUpdate(
      new mongoose.Types.ObjectId(blogId),
      { $set: updateFields },
      { new: true } // Return the updated document
    );

    console.log(result);
    if (!result) {
      return res.status(404).json({ error: "Blog not found" });
    }

    res.status(200).json({
      success: true,
      message: "Blog updated successfully",
      data: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getBlogById = async (req, res) => {
  try {
    const { slug } = req.params;

    // Find the blog by slug
    const blog = await blogs.findOne({ slug }).lean(); // .lean() returns plain JavaScript objects

    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    // Find the category by ID
    const blogCategory = await categories.findById(blog.category).lean();

    // Find the published comments related to the blog
    const blogCommentsData = await blogComments
      .find(
        {
          blogId: blog._id,
          status: "published",
        },
        {
          _id: 1,
          comment: 1,
          createdAt: 1,
        }
      )
      .lean();

    // Add comments and category to the blog object
    blog.comments = blogCommentsData;
    blog.category = blogCategory;

    res.status(200).json(blog);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getBlogByCategory = async (req, res) => {
  try {
    const { slug } = req.params;

    // Find the category by slug
    const categoryData = await categories.findOne({ slug }).lean();

    let blogsData;
    if (categoryData) {
      // If category found, get blogs with that category
      blogsData = await blogs.find({ category: categoryData._id }).lean();
    } else {
      // If no category found, get all blogs
      blogsData = await blogs.find({}).lean();
    }

    const blogsWithData = blogsData.map((blog) => ({
      ...blog,
      category: categoryData || {
        _id: null,
        name: "Uncategorized",
        slug: "uncategorized",
      },
    }));

    res.status(200).json(blogsWithData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// const getBlogsByCategory = async (req, res) => {
//   try {
//     const { slug } = req.params;

//     // Aggregation pipeline to find blogs by category slug
//     const blogsByCategory = await blogs.aggregate([
//       {
//         $lookup: {
//           from: "categories", // Collection name
//           localField: "category",
//           foreignField: "_id",
//           as: "category",
//         },
//       },
//       {
//         $match: {
//           "category.slug": slug,
//         },
//       },
//       {
//         $project: {
//           title: 1,
//           description: 1,
//           featureImage: 1,
//           createdAt: 1,
//           updatedAt: 1,
//           tags: 1,
//           author: 1,
//           slug: 1,
//           category: { $arrayElemAt: ["$category", 0] },
//         },
//       },
//     ]);

//     res.status(200).send({ success: true, data: blogsByCategory });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send({ success: false, message: "Something went wrong!" });
//   }
// };

// const viewBlog = async (req, res) => {
//   try {
//     const { slug } = req.params;

//     // Aggregation pipeline to find a single blog by slug
//     const blog = await blogs.aggregate([
//       {
//         $match: {
//           slug: slug,
//         },
//       },
//       {
//         $lookup: {
//           from: "categories", // Collection name
//           localField: "category",
//           foreignField: "_id",
//           as: "category",
//         },
//       },
//       {
//         $project: {
//           title: 1,
//           description: 1,
//           featureImage: 1,
//           createdAt: 1,
//           updatedAt: 1,
//           tags: 1,
//           author: 1,
//           slug: 1,
//           category: { $arrayElemAt: ["$category", 0] },
//         },
//       },
//     ]);

//     // If blog not found, return 404
//     if (blog.length === 0) {
//       return res
//         .status(404)
//         .send({ success: false, message: "Blog not found!" });
//     }

//     res.status(200).send({ success: true, data: blog[0] });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send({ success: false, message: "Something went wrong!" });
//   }
// };

const removeBlog = async (req, res) => {
  try {
    const { blogId } = req.params;
    console.log(blogId);

    const result = await blogs.deleteOne({ _id: new ObjectId(blogId) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Blog not found" });
    }
    res.status(200).json({
      message: "Blog deleted successfully",
      data: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  createBlog,
  getAllBlogs,
  getBlogByCategory,
  updateBlogById,
  removeBlog,
  getBlogById,
};
