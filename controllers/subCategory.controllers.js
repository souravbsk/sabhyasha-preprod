const { default: mongoose } = require("mongoose");
const { SubCategory } = require("../models/subCategoryModel");
const { uploadToS3 } = require("../utlis/awsTools");
const { slugGenerator } = require("../utlis/slugGenerate");
const { productParentCategory } = require("../models/parentCategoryModel");
const { productCategory } = require("../models/productCategoryModel");
const { ObjectId } = require("mongodb");

const createSubCategory = async (req, res) => {
  try {
    const { name, parentCategoryId, productCategoryId } = req.body;

    const imageURLs = await uploadToS3("SubCategory")(req, res, async () => {
      try {
        const existingSlugs = await SubCategory.find({}).distinct("slug");
        const generateSlugUrl = await slugGenerator(name, existingSlugs);

        const subCategoryData = {
          name,
          parentCategoryId: new mongoose.Types.ObjectId(parentCategoryId),
          productCategoryId: new mongoose.Types.ObjectId(productCategoryId),
          image: req.fileUrls[0],
          slug: generateSlugUrl,
        };

        const insertedSubCategory = new SubCategory(subCategoryData);
        await insertedSubCategory.save();

        if (!insertedSubCategory) {
          return res.status(404).json({ error: "Sub Category not found" });
        }

        res.status(201).json({
          success: true,
          message: "Sub Category created successfully",
          data: insertedSubCategory,
        });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllSubCategories = async (req, res) => {
  try {
    // Fetch all subcategories, sorted by createdAt in descending order
    const productSubCategories = await SubCategory.find({})
      .sort({ createdAt: -1 })
      .lean();

    if (!productSubCategories || productSubCategories.length === 0) {
      return res.status(404).json({ error: "Sub Categories not found" });
    }

    // Use Promise.all to fetch parent and product categories asynchronously
    const productSubCategoriesResult = await Promise.all(
      productSubCategories.map(async (category) => {
        const parentCategoryResult = await productParentCategory
          .findById(category.parentCategoryId, "_id name")
          .lean();

        const productCategoryResult = await productCategory
          .findById(category.productCategoryId, "_id name")
          .lean();

        return {
          ...category,
          parentCategory: parentCategoryResult,
          productCategory: productCategoryResult,
        };
      })
    );

    res.status(200).json({
      success: true,
      message: "Sub Categories retrieved successfully",
      data: productSubCategoriesResult,
    });
  } catch (error) {
    console.error("Error retrieving subcategories:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateSubCategoryById = async (req, res) => {
  try {
    const subcategoryId = req.params.subcategoryId;
    if (!subcategoryId) {
      return res.status(400).json({ error: "Subcategory ID is required" });
    }

    const { name, parentCategoryId, productCategoryId,images } = req.body;
    const updatedAt = new Date();

    let imageURL;
    if (images) {
      imageURL = images;
    } else {
      try {
        await uploadToS3("SubCategory")(req, res);
        imageURL = req.fileUrls[0];
      } catch (uploadError) {
        console.error("Error uploading image:", uploadError);
        return res.status(500).json({ error: "Error uploading image" });
      }
    }

    // Build the update object dynamically to avoid overwriting fields with undefined
    const updateData = { updatedAt };
    if (name) updateData.name = name;
    if (parentCategoryId) updateData.parentCategoryId = parentCategoryId;
    if (productCategoryId) updateData.productCategoryId = productCategoryId;
    if (imageURL) updateData.image = imageURL;

    const result = await SubCategory.findByIdAndUpdate(
      subcategoryId,
      { $set: updateData },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ error: "Sub Category not found" });
    }

    res.status(200).json({
      success: true,
      message: "Sub Category updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error updating subcategory:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteSubCategoryById = async (req, res) => {
  try {
    const subcategoryId = req.params.subcategoryId;
    console.log(subcategoryId);

    const filter = { _id: new ObjectId(subcategoryId) };

    const deletedSubCategory = await SubCategory.deleteOne(filter);

    if (!deletedSubCategory) {
      return res.status(404).json({ error: "Product Category not found" });
    }

    res.status(200).json({
      success: true,
      message: "Product Category deleted successfully",
      data: deletedSubCategory,
    });
  } catch (error) {
    console.error("Error deleting subcategory:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllSubCategoryById = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    let filterCategoryId;
    try {
      filterCategoryId = new mongoose.Types.ObjectId(categoryId);
    } catch (error) {
      return res.status(400).json({ error: "Invalid parentcategoryId" });
    }

    // Query using Mongoose model
    const productSubCategories = await SubCategory.find({
      productCategoryId: filterCategoryId,
    })
      .select("_id name productCategoryId parentCategoryId") // Specify fields to fetch
      .sort({ createdAt: -1 })
      .lean(); // Convert Mongoose document to plain JavaScript object

    if (!productSubCategories || productSubCategories.length === 0) {
      return res
        .status(404)
        .json({ error: "Product Sub Categories not found" });
    }

    res.status(200).json({
      success: true,
      message: "Product Sub Categories retrieved successfully",
      data: productSubCategories,
    });
  } catch (error) {
    console.error("Error retrieving product subcategories:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  createSubCategory,
  getAllSubCategories,
  updateSubCategoryById,
  deleteSubCategoryById,
  getAllSubCategoryById,
};
