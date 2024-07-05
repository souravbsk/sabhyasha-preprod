const { default: mongoose } = require("mongoose");
const { categories } = require("../models/blogCategoryModel");
const { slugGenerator } = require("../utlis/slugGenerate");

const createCategory = async (req, res) => {
  try {
    const { name, description, type } = req.body;
    console.log(req.body);
    const existingCategory = await categories.findOne({ name });
    if (existingCategory) {
      return res
        .status(400)
        .json({ error: "Category with this name already exists" });
    }

    const existingSlugs = await categories.find({}).distinct("slug");
    console.log(existingSlugs, "fsda");

    // slug url start
    const generateSlugUrl = await slugGenerator(name, existingSlugs);

    const newBlogCategory = new categories({
      name,
      description,
      // author: mongoose.Types.ObjectId(author),
      type,
      slug: generateSlugUrl,
    });

    const savedBlogCategory = await newBlogCategory.save();

    console.log(savedBlogCategory);

    if (!savedBlogCategory) {
      res.status(404).json({ error: "Category not found" });
    }
    return res.status(201).send({
      success: true,
      data: savedBlogCategory,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// get all category
const getAllCategories = async (req, res) => {
  try {
    console.log("first");
    const categoriesList = await categories.find({});
  
    console.log(categoriesList);

    if (!categoriesList.length) {
      return res.status(404).json({ error: "Categories not found" });
    }
    res.status(200).json({
      message: "Categories retrieved successfully",
      data: categoriesList,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get single category by ID
const getCategoryById = async (req, res) => {
  try {
    const { categoryId } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ error: "Invalid category ID" });
    }

    // Find the category by ID
    const category = await categories.findById(categoryId);

    // Check if category exists
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Return the found category
    res.status(200).json({
      message: "Category retrieved successfully",
      data: category,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// update by category

const updateCategoryById = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, description, type, author } = req.body;
    const updatedAt = new Date();

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ error: "Invalid category ID" });
    }

    // Generate a unique slug
    const existingSlugs = await categories.find({}).distinct("slug");
    const generateSlugUrl = await slugGenerator(name, existingSlugs);

    // Update the category in the database
    const result = await categories.updateOne(
      { _id: new mongoose.Types.ObjectId(categoryId) },
      {
        $set: {
          name,
          description,
          type,
          updatedAt,
          slug: generateSlugUrl,
          author: new mongoose.Types.ObjectId(author),
        },
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Return the updated category
    return res.status(200).json({
      message: "Category updated successfully",
      data: result,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Delete category by ID
const deleteCategoryById = async (req, res) => {
  try {
    const { categoryId } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ error: "Invalid category ID" });
    }
    const categoryCollection = mongoose.connection.db.collection('categories');
    console.log(categoryCollection, "fsdsad")
    // Delete the category from the database
    const result = await categories.deleteOne({
      _id: new mongoose.Types.ObjectId(categoryId),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Return success message
    res.status(200).json({
      message: "Category deleted successfully",
      data: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};





module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategoryById,
  deleteCategoryById,
};
