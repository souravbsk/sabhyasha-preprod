const { blogs } = require("../models/BlogModel");
const { default: mongoose } = require("mongoose");
const { ObjectId } = require("mongodb");

const { slugGenerator } = require("../utlis/slugGenerate");
const { uploadToS3 } = require("../utlis/awsTools");
const { categories } = require("../models/blogCategoryModel");
const { default: slugify } = require("slugify");

const createBlog = async (req, res) => {
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

    await uploadToS3("Blog")(req, res, async () => {
      try {
        const featureImage = {
          imageURL: req.fileUrls[0],
          featureImgAlt,
          featureImageDescription,
        };
        const existingSlugs = await blogs.find({}).distinct("slug");
        const generateSlugUrl = await slugGenerator(title, existingSlugs);
        // const authorId = new ObjectId(author);
        const categoryId = new ObjectId(category);
        const newBlog = new blogs({
          title,
          description,
          // author: mongoose.Types.ObjectId(author),
          category: categoryId,
          tags: tagsArray,
          featureImage,
          createdAt,
          slug: generateSlugUrl,
        });

        const savedBlog = await newBlog.save();

        return res.status(201).send({
          success: true,
          data: savedBlog,
        });
      } catch (error) {
        console.error(error);
        return res
          .status(500)
          .send({ success: false, message: "Failed to create blog post" });
      }
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .send({ success: false, message: "Internal Server Error" });
  }
};

const getAllBlogs = async (req, res) => {
  try {
    const allBlogs = await blogs.find({});

    // Fetch all categories
    const categoryIds = allBlogs.map((blog) => blog.category);
    const categoryMap = new Map();

    await Promise.all(
      categoryIds.map(async (categoryId) => {
        const category = await categories.findById(categoryId);
        categoryMap.set(categoryId.toString(), category);
      })
    );

    // Map categories to blogs
    const blogsWithCategories = allBlogs.map((blog) => {
      const category = categoryMap.get(blog.category.toString());
      return {
        ...blog.toObject(), // Convert Mongoose document to plain JavaScript object
        category: category
          ? { name: category.name, slug: category.slug, id: category._id }
          : null,
      };
    });

    res.status(200).send({ success: true, data: blogsWithCategories });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: "Something went wrong!" });
  }
};

const getBlogsByCategory = async (req, res) => {
  try {
    const { slug } = req.params;

    // Aggregation pipeline to find blogs by category slug
    const blogsByCategory = await blogs.aggregate([
      {
        $lookup: {
          from: "categories", // Collection name
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $match: {
          "category.slug": slug,
        },
      },
      {
        $project: {
          title: 1,
          description: 1,
          featureImage: 1,
          createdAt: 1,
          updatedAt: 1,
          tags: 1,
          author: 1,
          slug: 1,
          category: { $arrayElemAt: ["$category", 0] },
        },
      },
    ]);

    res.status(200).send({ success: true, data: blogsByCategory });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: "Something went wrong!" });
  }
};

const viewBlog = async (req, res) => {
  try {
    const { slug } = req.params;

    // Aggregation pipeline to find a single blog by slug
    const blog = await blogs.aggregate([
      {
        $match: {
          slug: slug,
        },
      },
      {
        $lookup: {
          from: "categories", // Collection name
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $project: {
          title: 1,
          description: 1,
          featureImage: 1,
          createdAt: 1,
          updatedAt: 1,
          tags: 1,
          author: 1,
          slug: 1,
          category: { $arrayElemAt: ["$category", 0] },
        },
      },
    ]);

    // If blog not found, return 404
    if (blog.length === 0) {
      return res
        .status(404)
        .send({ success: false, message: "Blog not found!" });
    }

    res.status(200).send({ success: true, data: blog[0] });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: "Something went wrong!" });
  }
};

const updateBlog = async (req, res) => {
  try {
    const { blogId } = req.params;
    const {
      title,
      description,
      author,
      category,
      slug,
      tags,
      featureImgAlt,
      featureImageDescription,
      image,
    } = req.body;

    const tagsArray = tags ? tags.split(",") : [];

    const existingSlugs = await blogs
      .find({ _id: { $ne: blogId } })
      .distinct("slug");
    const generateSlugUrl = await slugGenerator(title, existingSlugs);

    let imageURL;
    if (image) {
      imageURL = image;
    } else {
      const imageURLs = await uploadToS3("Blog")(req, res);
      imageURL = req.fileUrls[0];
    }

    const updatedData = {
      title,
      description,
      tags: tagsArray,
      featureImage: {
        imageURL: imageURL,
        featureImgAlt,
        featureImageDescription,
      },
      slug: generateSlugUrl,
      updatedAt: new Date(),
    };

    if (author) {
      updatedData.author = mongoose.Types.ObjectId(author);
    }
    if (category) {
      updatedData.category = mongoose.Types.ObjectId(category);
    }

    const updatedBlog = await blogs
      .findByIdAndUpdate(blogId, updatedData, { new: true })
      .exec();

    if (!updatedBlog) {
      return res
        .status(404)
        .send({ success: false, message: "Blog not found!" });
    }

    res.status(200).send({
      success: true,
      data: updatedBlog,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .send({ success: false, message: "Failed to update blog post" });
  }
};

const removeBlog = async (req, res) => {
  try {
    const { blogId } = req.params;
    const deletedBlog = await blogs.findByIdAndDelete(blogId).exec();
    if (!deletedBlog) {
      return res
        .status(404)
        .send({ success: false, message: "Blog not found!" });
    }
    res
      .status(200)
      .send({ success: true, message: "Blog post removed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: "Something went wrong!" });
  }
};

module.exports = {
  createBlog,
  getAllBlogs,
  getBlogsByCategory,
  viewBlog,
  updateBlog,
  removeBlog,
};
