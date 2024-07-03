const { ObjectId } = require("mongodb");
const { productParentCategory } = require("../models/parentCategoryModel");
const { productCategory } = require("../models/productCategoryModel");
const { Product } = require("../models/productModel");
const { Stores } = require("../models/storeModel");
const { SubCategory } = require("../models/subCategoryModel");
const { uploadToS3 } = require("../utlis/awsTools");
const {
  removeGapFromValue,
  excelDateToJSDate,
  excelToCategoryId,
} = require("../utlis/bulkUploadFeature");
const excelToBoolean = require("../utlis/excelToBoolean");
const { slugGenerator } = require("../utlis/slugGenerate");
const xlsx = require("xlsx");
const { default: mongoose } = require("mongoose");

const createProduct = async (req, res) => {
  try {
    const { newProduct } = req.body;
    const newProductParse = JSON.parse(newProduct);

    const createdAt = new Date();

    // Filter to divide images
    const featureImageFiles = req.files.filter(
      (file) => file?.fieldname === "productFeatureImage"
    );
    const productGalleryImage = req.files.filter(
      (file) => file?.fieldname !== "productFeatureImage"
    );

    // Upload feature image to S3 and get URL
    req.files = featureImageFiles;
    await uploadToS3("Product")(req, res);
    const featureImageUrl = req.fileUrls[0];

    const featureImage = {
      imageUrl: featureImageUrl,
    };

    // Upload product gallery images to S3 and get URLs
    req.files = productGalleryImage;
    await uploadToS3("Product")(req, res);
    const productGalleryImageUrls = req.fileUrls;
    const existingSlugs = await Product.find({}).distinct("slug");
    // Generate slug
    const generateSlugUrl = await slugGenerator(
      newProductParse.name,
      existingSlugs // Use Mongoose model for slug generation
    );

    // Convert Excel boolean values
    newProductParse.returnable = excelToBoolean(newProductParse.returnable);
    newProductParse.cancellable = excelToBoolean(newProductParse.cancellable);
    newProductParse.available_for_cod = excelToBoolean(
      newProductParse.available_for_cod
    );
    newProductParse.seller_pickup_return = excelToBoolean(
      newProductParse.seller_pickup_return
    );

    // Create new product document
    const newProductData = new Product({
      ...newProductParse,
      image: featureImage,
      productGalleryImageUrls,
      view_count: null,
      createdAt,
      slug: generateSlugUrl,
    });

    // Save the new product to the database
    const insertedProduct = await newProductData.save();

    if (!insertedProduct) {
      return res.status(404).json({ error: "Product not created" });
    }

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: insertedProduct,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllProducts = async (req, res) => {
  try {
    console.log(productParentCategory.collection.collectionName);
    const pipeline = [
      // Stage 1: $lookup to get parent category details
      {
        $lookup: {
          from: productParentCategory.collection.collectionName,
          let: {
            parent_category_id: {
              $cond: {
                if: { $ne: ["$parent_category_id", ""] },
                then: { $toObjectId: "$parent_category_id" },
                else: null,
              },
            },
          },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$parent_category_id"] },
              },
            },
          ],
          as: "parentCategory",
        },
      },
      // Stage 2: $lookup to get category name
      {
        $lookup: {
          from: productCategory.collection.collectionName,
          let: {
            category_id: {
              $cond: {
                if: { $ne: ["$category_id", ""] },
                then: { $toObjectId: "$category_id" },
                else: null,
              },
            },
          },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$category_id"] },
              },
            },
          ],
          as: "category",
        },
      },
      // Stage 3: $lookup to get subcategory name
      {
        $lookup: {
          from: SubCategory.collection.collectionName,
          let: {
            subcategory_id: {
              $cond: {
                if: { $ne: ["$subcategory_id", ""] },
                then: { $toObjectId: "$subcategory_id" },
                else: null,
              },
            },
          },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$subcategory_id"] },
              },
            },
          ],
          as: "subCategory",
        },
      },
      // Stage 4: $lookup to get store name
      {
        $lookup: {
          from: Stores.collection.collectionName,
          let: {
            store_address_id: {
              $cond: {
                if: { $ne: ["$store_address_id", ""] },
                then: { $toObjectId: "$store_address_id" },
                else: null,
              },
            },
          },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$_id", "$$store_address_id"] },
              },
            },
          ],
          as: "store",
        },
      },
      // Stage 5: $sort
      {
        $sort: { createdAt: -1 },
      },
      // Stage 6: $project
      {
        $project: {
          _id: 1,
          name: 1,
          price: 1,
          createdAt: 1,
          isCustomizable: 1,
          hsnCode: 1,
          tax_rate: 1,
          tags: 1,
          date_available: 1,
          dispatch_in_days: 1,
          quantity: 1,
          discount: 1,
          additional_shipping_cost: 1,
          image: 1,
          slug: 1,
          status: 1,
          parentCategory: {
            $cond: {
              if: { $eq: [{ $size: "$parentCategory" }, 0] },
              then: null,
              else: {
                _id: { $arrayElemAt: ["$parentCategory._id", 0] },
                name: { $arrayElemAt: ["$parentCategory.name", 0] },
              },
            },
          },
          category: {
            $cond: {
              if: { $eq: [{ $size: "$category" }, 0] },
              then: null,
              else: {
                _id: { $arrayElemAt: ["$category._id", 0] },
                name: { $arrayElemAt: ["$category.name", 0] },
              },
            },
          },
          subCategory: {
            $cond: {
              if: { $eq: [{ $size: "$subCategory" }, 0] },
              then: null,
              else: {
                _id: { $arrayElemAt: ["$subCategory._id", 0] },
                name: { $arrayElemAt: ["$subCategory.name", 0] },
              },
            },
          },
          store: {
            $cond: {
              if: { $eq: [{ $size: "$store" }, 0] },
              then: null,
              else: {
                _id: { $arrayElemAt: ["$store._id", 0] },
                name: { $arrayElemAt: ["$store.name", 0] },
              },
            },
          },
        },
      },
    ];

    const products = await Product.aggregate(pipeline);
    const totalItems = await Product.countDocuments();
    const totalPublishedItems = await Product.countDocuments({
      status: "published",
    });
    const totalDraftItems = await Product.countDocuments({ status: "draft" });

    res.status(200).json({
      products,
      totalDraftItems,
      totalItems,
      totalPublishedItems,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const quickUpdateProductById = async (req, res) => {
  try {
    const productId = req.params.productId;
    const updateProductProperty = req.body;
    const { slug } = req.body; // Destructure slug from req.body

    const updatedAt = new Date();
    console.log(updateProductProperty, productId);

    if (slug) {
      // Generate slug URL if slug exists
      const existingSlugs = await Product.find({}).distinct("slug");
      const generateSlugUrl = await slugGenerator(slug, existingSlugs);
      // Include slug in the update if it exists
      updateProductProperty.slug = generateSlugUrl;
    }

    // Include updatedAt in the update
    updateProductProperty.updatedAt = updatedAt;

    // Update the product using Mongoose
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { $set: updateProductProperty },
      { new: true } // Return the updated document
    );

    if (!updatedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    console.log(updatedProduct);
    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const bulkUploadProducts = async (req, res) => {
  try {
    console.log(req.files[0]);
    // if (!req.file) {
    //   return res.status(400).json({ error: "No file uploaded" });
    // }
    const parentCategoryCollection =
      productParentCategory.collection.collectionName;
    const categoryCollection = productCategory.collection.collectionName;
    const subCategoryCollection = SubCategory.collection.collectionName;
    const storeCollectionName = Stores.collection.collectionName;
    const existingSlugs = await Product.find({}).distinct("slug");

    // console.log(storeCollectionName);

    // Fetch categories and stores data in parallel
    const [
      storeCollectionResult,
      parentCategoryResult,
      categoryResult,
      subCategoryResult,
    ] = await Promise.all([
      Stores.find({}, { _id: 1, name: 1 }).lean(),
      productParentCategory.find({}, { _id: 1, name: 1 }).lean(),
      productCategory.find({}, { _id: 1, name: 1 }).lean(),
      SubCategory.find({}, { _id: 1, name: 1 }).lean(),
    ]);

    console.log(
      storeCollectionResult,
      parentCategoryResult,
      categoryResult,
      subCategoryResult
    );

    // console.log(parentCategoryResult);

    // Read the Excel file
    const workbook = xlsx.read(req.files[0].buffer, { type: "buffer" });

    // // Assuming the first sheet contains the data
    const sheetName = workbook.SheetNames[1];
    // // console.log(sheetName);
    const sheet = workbook.Sheets[sheetName];

    // // Convert the sheet to JSON
    let json = xlsx.utils.sheet_to_json(sheet, { defval: null });
    // // console.log(json);

    const requiredFields = [
      "Parent Category",
      "Category",
      "Product Title",
      "Short Description",
      "Long Description",
      "Product Available From",
      "Dispatch in Days",
      "MRP",
      "Discount",
      "Quantity",
      "Minimum Orders",
      "Maximum Orders",
      "Height Of The Product",
      "Length Of The Product",
      "Width Of The Product",
      "Height After Package",
      "Length After Package",
      "Width After Package",
      "Weight Of The Product",
      "Weight After Package",
      "Returnable",
      "Cancellable",
      "Available For COD",
      "Seller Return Pickup",
      "Product Return Window",
      "Is Shipping Cost Included",
    ];

    // // List of fields that should be numbers
    const numericFields = [
      "Dispatch in Days",
      "MRP",
      "Discount",
      "Quantity",
      "Minimum Orders",
      "Maximum Orders",
      "Height Of The Product",
      "Length Of The Product",
      "Width Of The Product",
      "Height After Package",
      "Length After Package",
      "Width After Package",
      "Weight Of The Product",
      "Weight After Package",
      "Product Return Window",
      "HSN Code",
    ];

    const processedData = await Promise.all(
      json.map(async (item, index) => {
        const rowNumber = index + 2;

        const normalizedItem = {};
        for (let key in item) {
          normalizedItem[removeGapFromValue(key)] = item[key];
        }

        // Check for required fields
        for (let field of requiredFields) {
          const normalizedField = removeGapFromValue(field);
          if (
            !normalizedItem.hasOwnProperty(normalizedField) ||
            normalizedItem[normalizedField] === null ||
            normalizedItem[normalizedField] === undefined ||
            normalizedItem[normalizedField] === ""
          ) {
            throw new Error(
              `Missing required field: ${field} at row ${rowNumber}`
            );
          }
        }

        // Check numeric fields
        for (let field of numericFields) {
          const normalizedField = removeGapFromValue(field);
          if (normalizedItem.hasOwnProperty(normalizedField)) {
            let value = normalizedItem[normalizedField];
            if (value === "" || isNaN(value)) {
              throw new Error(
                `Field ${field} must be a number at row ${rowNumber}`
              );
            }
          }
        }

        // Generate slug URL for the product

        let uniqueSlug = await slugGenerator(
          normalizedItem[removeGapFromValue("ProductTitle")],
          existingSlugs
        );

        // If uniqueSlug is different from generateSlugUrl, it means there was a conflict
        // and a unique slug was generated.

        // Parse the 'Product Available From' date

        // Convert 'MRP' to a decimal number with two decimal places

        const excelDate =
          normalizedItem[removeGapFromValue("ProductAvailableFrom")];
        const tagsGenerate =
          normalizedItem[removeGapFromValue("ProductTags")]?.split(", ");
        const productGalleryImageUrls =
          normalizedItem[removeGapFromValue("ProductGalleryImages")]?.split(
            ", "
          );

        const generateStatus = (normalizedItem) => {
          if (
            !normalizedItem[removeGapFromValue("hsncode")] ||
            !normalizedItem[removeGapFromValue("gst")]
          ) {
            return "draft";
          } else {
            return "published";
          }
        };

        const newProduct = {
          name: normalizedItem[removeGapFromValue("ProductTitle")],
          parent_category_id: excelToCategoryId(
            normalizedItem[removeGapFromValue("ParentCategory")],
            parentCategoryResult
          ),
          category_id: excelToCategoryId(
            normalizedItem[removeGapFromValue("Category")],
            categoryResult
          ),
          subcategory_id: excelToCategoryId(
            normalizedItem[removeGapFromValue("Sub-Category")],
            subCategoryResult
          ),
          isCustomizable: false,
          hsnCode: normalizedItem[removeGapFromValue("HSNCode")],
          tax_rate: 0.0,
          short_description:
            normalizedItem[removeGapFromValue("ShortDescription")],
          description: normalizedItem[removeGapFromValue("LongDescription")],
          tags: tagsGenerate,
          meta_title: normalizedItem[removeGapFromValue("MetaTitle")],
          meta_keyword: normalizedItem[removeGapFromValue("MetaKeywords")],
          meta_description:
            normalizedItem[removeGapFromValue("MetaDescription")],
          date_available: excelDateToJSDate(excelDate),
          dispatch_in_days:
            normalizedItem[removeGapFromValue("DispatchInDays")],
          store_address_id: excelToCategoryId(
            "Sabhyasha Retail Tech Pvt. Ltd.", //static
            storeCollectionResult
          ),
          quantity: normalizedItem[removeGapFromValue("Quantity")],
          sort_order: normalizedItem[removeGapFromValue("ProductSortOrder")],
          minimum_order: normalizedItem[removeGapFromValue("MinimumOrders")],
          maximum_order: normalizedItem[removeGapFromValue("MaximumOrders")],
          height: normalizedItem[removeGapFromValue("HeightOfTheProduct")],
          height_after_package:
            normalizedItem[removeGapFromValue("HeightAfterPackage")],
          weight: normalizedItem[removeGapFromValue("WeightOfTheProduct")],
          weight_after_package:
            normalizedItem[removeGapFromValue("WeightAfterPackage")],
          length: normalizedItem[removeGapFromValue("LengthOfTheProduct")],
          length_after_package:
            normalizedItem[removeGapFromValue("LengthAfterPackage")],
          width: normalizedItem[removeGapFromValue("WidthOfTheProduct")],
          width_after_package:
            normalizedItem[removeGapFromValue("WidthAfterPackage")],
          returnable: excelToBoolean(
            normalizedItem[removeGapFromValue("Returnable")]
          ),
          cancellable: excelToBoolean(
            normalizedItem[removeGapFromValue("Cancellable")]
          ),
          available_for_cod: excelToBoolean(
            normalizedItem[removeGapFromValue("AvailableForCOD")]
          ),
          seller_pickup_return: excelToBoolean(
            normalizedItem[removeGapFromValue("SellerReturnPickup")]
          ),
          return_window:
            normalizedItem[removeGapFromValue("ProductReturnWindow")],
          price: normalizedItem[removeGapFromValue("MRP")],
          discount: normalizedItem[removeGapFromValue("Discount")],
          is_shipping_cost_included: excelToBoolean(
            normalizedItem[removeGapFromValue("IsShippingCostIncluded")]
          ),
          additional_shipping_cost: null,
          status: generateStatus(normalizedItem),
          image: {
            imageUrl: normalizedItem[removeGapFromValue("ProductMainImage")],
          },
          productGalleryImageUrls: productGalleryImageUrls,
          view_count: null,
          createdAt: new Date(),
          slug: uniqueSlug,
        };

        return newProduct;
      })
    );

    if (json.length !== processedData.length) {
      return res.status(400).json({
        error:
          "Mismatch between uploaded data length and processed data length",
      });
    }

    const BATCH_SIZE = 100;
    let totalInserted = 0;

    for (let i = 0; i < processedData.length; i += BATCH_SIZE) {
      const batch = processedData.slice(i, i + BATCH_SIZE);
      const result = await Product.insertMany(batch);
      console.log(result, "Batch inserted");
      totalInserted += result.length;
    }
    if (totalInserted === processedData.length) {
      res.status(200).json({
        totalInserted,
        success: true,
        message: "Products uploaded successfully",
      });
    } else {
      res
        .status(400)
        .json({ error: "Not all products were uploaded successfully" });
    }
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};

const deleteProductById = async (req, res) => {
  try {
    const { productId } = req.params;
    console.log(productId);

    const result = await Product.deleteOne({
      _id: new ObjectId(productId),
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.status(200).json({
      message: "Product deleted successfully",
      data: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const showProducts = async (req, res) => {
  try {
    const { sampleLength } = req.body;
    const data = [];
    const fetchedData = await Product.find({});
    sampleLength =
      sampleLength > fetchedData.length ? fetchedData.length : sampleLength;
    fetchedData.forEach((product) => {
      data.push({
        id: product._id,
        title: product.name,
        image: product.image,
        cost: product.price,
        salesStatus: product.quantity > 0 ? "Sale" : "unavailable",
      });
    });
    res.send({
      success: true,
      data: data.slice(0, sampleLength),
      message: "fetched products successfully!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};

const viewProduct = async (req, res) => {
  try {
    const productId = new ObjectId(req.params.productId);

    const product = await Product.aggregate([
      {
        $match: { _id: productId },
      },
      {
        $lookup: {
          from: "productParentCategory",
          localField: "parent_category_id",
          foreignField: "_id",
          as: "parentCategory",
        },
      },
      {
        $lookup: {
          from: "productCategory",
          localField: "category_id",
          foreignField: "_id",
          as: "productCategory",
        },
      },
      {
        $lookup: {
          from: "productSubCategory",
          localField: "subcategory_id",
          foreignField: "_id",
          as: "subCategory",
        },
      },
      {
        $lookup: {
          from: "stores",
          localField: "store_address_id",
          foreignField: "_id",
          as: "store",
        },
      },
      {
        $lookup: {
          from: "customizedFileds",
          localField: "customizations._id",
          foreignField: "_id",
          as: "customizations",
        },
      },
      {
        $project: {
          name: 1,
          short_description: 1,
          description: 1,
          isCustomizable: 1,
          hsnCode: 1,
          tax_rate: 1,
          image: 1,
          tags: 1,
          meta_title: 1,
          meta_keyword: 1,
          meta_description: 1,
          date_available: 1,
          dispatch_in_days: 1,
          quantity: 1,
          sort_order: 1,
          maximum_order: 1,
          minimum_order: 1,
          height: 1,
          height_after_package: 1,
          weight: 1,
          weight_after_package: 1,
          width: 1,
          width_after_package: 1,
          length: 1,
          length_after_package: 1,
          returnable: 1,
          cancellable: 1,
          available_for_cod: 1,
          seller_pickup_return: 1,
          return_window: 1,
          price: 1,
          discount: 1,
          is_shipping_cost_included: 1,
          additional_shipping_cost: 1,
          slug: 1,
          view_count: 1,
          productGalleryImageUrls: 1,
          "parentCategory.name": 1,
          "productCategory.name": 1,
          "subCategory.name": 1,
          "store.name": 1,
          customizations: 1,
          createdAt: 1,
          updatedAt: 1,
          author: 1,
          status: 1,
        },
      },
    ]);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      success: true,
      data: product,
      message: "Product fetched successfully!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  quickUpdateProductById,
  bulkUploadProducts,
  deleteProductById,
  showProducts,
  viewProduct,
};
