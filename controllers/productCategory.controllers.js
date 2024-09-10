const { customizedFields } = require("../models/customizationModel");
const { productParentCategory } = require("../models/parentCategoryModel");
const { productCategory } = require("../models/productCategoryModel");
const { Product } = require("../models/productModel");
const { uploadToS3 } = require("../utlis/awsTools");
const collections = require("../utlis/collections");
const { slugGenerator } = require("../utlis/slugGenerate");
const { ObjectId, Types, default: mongoose } = require("mongoose");
const createProductCategory = async (req, res) => {
  try {
    const { name, parentCategoryId, isCustomizable, selectedFields } = req.body;
    const selectedFieldsParse = JSON.parse(selectedFields);

    // Upload image to S3 and await the result
    const imageURLs = await uploadToS3("ProductCategory")(req, res);
    const existingSlugs = await productCategory.find({}).distinct("slug");

    // Generate slug
    let generateSlugUrl = await slugGenerator(name, existingSlugs);

    // Create new Product Category document
    const newCategory = new productCategory({
      name,
      parentCategoryId,
      createdAt: new Date(),
      image: req.fileUrls ? req.fileUrls[0] : undefined,
      isCustomizable: isCustomizable && JSON.parse(isCustomizable),
      selectedFields: selectedFieldsParse,
      slug: generateSlugUrl,
    });

    // Save the new category to the database
    const insertedCategory = await newCategory.save();

    res.status(201).json({
      message: "Category created successfully",
      data: insertedCategory,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllProductCategories = async (req, res) => {
  try {
    // Fetch all product categories with parent and customized fields populated
    const productCategoriesResult = await productCategory
      .find({})
      .sort({ createdAt: -1 })
      .populate(
        "parentCategoryId",
        "-createdAt -updatedAt -slug -image -isCustomized"
      )
      .lean()
      .exec();

    if (!productCategoriesResult || productCategoriesResult.length === 0) {
      return res.status(404).json({ error: "Product Categories not found" });
    }

    // Process selected fields with details from customized fields
    await Promise.all(
      productCategoriesResult.map(async (category) => {
        if (
          category.isCustomizable &&
          category.selectedFields &&
          category.selectedFields.length > 0
        ) {
          const selectedFieldIds = category.selectedFields.map(
            (field) => field._id
          );

          console.log(category, "fsdfasda");
          const customizeFields = await customizedFields
            .find(
              { _id: { $in: selectedFieldIds } },
              "-type -options -createdAt"
            )
            .lean()
            .exec();

          category.selectedFields = category.selectedFields.map((field) => {
            const customFieldDetails = customizeFields.find(
              (customField) =>
                customField._id.toString() === field._id.toString()
            );
            return {
              ...field,
              ...customFieldDetails,
            };
          });
        }
      })
    );

    res.status(200).json({
      success: true,
      message: "Product Categories retrieved successfully",
      data: productCategoriesResult,
    });
  } catch (error) {
    console.error("Error retrieving product categories:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateProductCategoryById = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;

    const { name, parentCategoryId, images, isCustomizable, selectedFields } =
      req.body;
    const selectedFieldsParse = JSON.parse(selectedFields);
    const updatedAt = new Date();

    // Check if images were provided, else handle file upload
    let imageURL;
    if (images) {
      imageURL = images;
    } else {
      const imageUrls = await uploadToS3("ProductCategory")(req, res);
      imageURL = req?.fileUrls[0];
    }

    // Update product category using Mongoose

    console.log();

    const updatedCategory = await productCategory.findByIdAndUpdate(
      categoryId,
      {
        $set: {
          name,
          updatedAt,
          parentCategoryId,
          image: imageURL,
          isCustomizable: isCustomizable && JSON.parse(isCustomizable),
          selectedFields: selectedFieldsParse,
        },
      },
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ error: "Product Category not found" });
    }

    res.status(200).json({
      success: true,
      message: "Product Category updated successfully",
      data: updatedCategory,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteProductCategoryById = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;

    // Use Mongoose to delete the product category
    const deletedCategory = await productCategory.findByIdAndDelete(categoryId);

    if (!deletedCategory) {
      return res.status(404).json({ error: "Product Category not found" });
    }

    res.status(200).json({
      success: true,
      message: "Product Category deleted successfully",
      data: deletedCategory,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllProductCategoryById = async (req, res) => {
  try {
    const parentcategoryId = req.params.parentcategoryId;
    console.log(parentcategoryId, "fsafsdf");

    // Attempt to convert the parentcategoryId to ObjectId
    let filterCategoryId;
    try {
      filterCategoryId = new mongoose.Types.ObjectId(parentcategoryId);
    } catch (error) {
      return res.status(400).json({ error: "Invalid parentcategoryId" });
    }

    // Find product categories that match the parentCategoryId
    const productCategories = await productCategory
      .find({
        parentCategoryId: filterCategoryId,
      })
      .select("-image -slug -updatedAt -createdAt") // Exclude 'image' and 'slug' fields
      .lean();

    if (!productCategories || productCategories.length === 0) {
      return res.status(404).json({ error: "Product Categories not found" });
    }

    // Fetch details of each selected field
    await Promise.all(
      productCategories.map(async (category) => {
        if (category.selectedFields && category.selectedFields.length > 0) {
          const selectedFieldIds = category.selectedFields.map(
            (field) => new mongoose.Types.ObjectId(field._id)
          );

          // Query to fetch customized fields details
          const customizeFields = await customizedFields
            .find({ _id: { $in: selectedFieldIds } })
            .select("-createdAt")
            .lean();

          // Map and merge selectedFields with detailed customizeFields
          category.selectedFields = category.selectedFields.map((field) => {
            const detailedField = customizeFields.find((cf) =>
              cf._id.equals(field._id)
            );
            return detailedField ? { ...field, ...detailedField } : field;
          });
        }
      })
    );

    res.status(200).json({
      success: true,
      message: "Product Categories retrieved successfully",
      data: productCategories,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllCategoryById = async (req, res) => {
  try {
    const parentcategoryId = req.params.parentcategoryId;

    // Attempt to convert the parentcategoryId to ObjectId
    let filterCategoryId;
    try {
      filterCategoryId = new mongoose.Types.ObjectId(parentcategoryId);
    } catch (error) {
      return res.status(400).json({ error: "Invalid parentcategoryId" });
    }

    // Find product categories that match the parentCategoryId
    const productCategories = await productCategory
      .find({
        parentCategoryId: filterCategoryId,
      })
      .select(
        "-image -slug -updatedAt -createdAt -selectedFields -isCustomizable"
      ) // Exclude 'image' and 'slug' fields
      .lean();

    if (!productCategories || productCategories.length === 0) {
      return res.status(404).json({ error: "Product Categories not found" });
    }

    // Fetch details of each selected field

    res.status(200).json({
      success: true,
      message: "Product Categories retrieved successfully",
      data: productCategories,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllCategoryForShop = async (req, res) => {
  try {
    let { productCategoryLength = 15 } = req.query;

    // Aggregate product counts for each category
    const productCounts = await Product.aggregate([
      {
        $match: { category_id: { $ne: null } } // Filter out documents with null category_id
      },
      {
        $group: {
          _id: "$category_id", // Use category_id instead of productCategoryId
          count: { $sum: 1 },
        },
      },
    ]);

    // Convert the product counts array into an object for easier access
    const productCountMap = productCounts.reduce((acc, curr) => {
      if (curr._id) {
        acc[curr._id.toString()] = curr.count; // Convert ObjectId to string for key
      }
      return acc;
    }, {});

    // Fetch the categories with the product counts
    const categoryCollection = await productCategory.aggregate([
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "category_id", // Use category_id instead of productCategoryId
          as: "products",
        },
      },
      {
        $addFields: {
          productCount: {
            $size: "$products",
          },
        },
      },
      {
        $project: {
          name: 1,
          slug: 1,
          image: 1,
          productCount: 1,
        },
      },
      {
        $sort: { productCount: -1 }, 
      },
      {
        $limit: parseInt(productCategoryLength, 10), 
      },
    ]);

    res.status(200).json(categoryCollection);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error", errorMessage: error });
  }
};

module.exports = {
  createProductCategory,
  getAllProductCategories,
  updateProductCategoryById,
  deleteProductCategoryById,
  getAllProductCategoryById,
  getAllCategoryById,
  getAllCategoryForShop,
};
