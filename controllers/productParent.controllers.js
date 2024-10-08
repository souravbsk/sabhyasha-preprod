const { ObjectId } = require("mongodb");
const { productParentCategory } = require("../models/parentCategoryModel");
const { uploadToS3 } = require("../utlis/awsTools");
const { slugGenerator, slugModifyGenerate } = require("../utlis/slugGenerate");
const { productCategory } = require("../models/productCategoryModel");

const createParentCategory = async (req, res) => {
  try {
    const { name } = req.body;

    // user checker start
    const decoded = req.decoded;

    const userEmail = decoded?.email;
    // user checker end

    // Upload image to S3 and await the result
    const imageURLs = await uploadToS3("ParentCategory")(req, res);
    const imageURL = req.fileUrls[0];
    const existingSlugs = await productParentCategory.find({}).distinct("slug");
    // Generate slug
    const generateSlugUrl = await slugGenerator(name, existingSlugs);

    // Create new ParentCategory document
    const newCategory = new productParentCategory({
      name,
      createdAt: new Date(),
      image: imageURL,
      created_by: userEmail,
      slug: generateSlugUrl,
    });

    // Save the new category to the database
    const insertedCategory = await newCategory.save();

    res.status(201).json({
      message: "Product Parent Category created successfully",
      data: insertedCategory,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// get all parent Category

const getAllParentCategories = async (req, res) => {
  try {
    // Fetch all parent categories from MongoDB using Mongoose
    const parentCategories = await productParentCategory.find(
      {},
      { createdAt: 0, updatedAt: 0 }
    );

    if (!parentCategories || parentCategories.length === 0) {
      return res
        .status(404)
        .json({ error: "Product Parent Category not found" });
    }

    res.status(200).json({
      success: true,
      message: "Product Parent Categories retrieved successfully",
      data: parentCategories,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//update parent category

const updateParentCategoryById = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const { name, image } = req.body;
    const updatedAt = new Date();

    // user checker start
    const decoded = req.decoded;

    const userEmail = decoded?.email;
    // user checker end

    let imageURL;
    if (image) {
      imageURL = image;
    } else {
      const imageUrls = await uploadToS3("ParentCategory")(req, res);
      imageURL = req.fileUrls[0];
    }

    console.log(imageURL);

    const updatedCategory = await productParentCategory.findByIdAndUpdate(
      categoryId,
      {
        $set: { name, updatedAt, image: imageURL, updated_by: userEmail },
      },
      { new: true } // To return the updated document
    );

    if (!updatedCategory) {
      return res.status(404).json({ error: "Parent Category not found" });
    }

    res.status(200).json({
      message: "Parent Category updated successfully",
      data: updatedCategory,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//delete parent category
const deleteParentCategoryById = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;

    const filter = new ObjectId(categoryId);

    const deletedCategory = await productParentCategory.deleteOne(filter);

    if (!deletedCategory) {
      return res
        .status(404)
        .json({ error: "Product Parent Category not found" });
    }

    res.status(200).json({
      success: true,
      message: "Product Parent Category deleted successfully",
      data: deletedCategory,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  createParentCategory,
  getAllParentCategories,
  updateParentCategoryById,
  deleteParentCategoryById,
};
