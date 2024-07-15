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
            normalizedItem[removeGapFromValue("ParentCategory")] || null,
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

// show product for user ui
const showProducts = async (req, res) => {
  try {
    // console.log(req.query);
    let { productLength = 15 } = req.query;

    // Fetch the total number of products
    const totalProducts = await Product.countDocuments();

    // Adjust productLength if it's greater than the total number of products
    productLength = Math.min(parseInt(productLength), totalProducts);

    // Define the aggregation pipeline
    const pipeline = [
      {
        $project: {
          title: "$name",
          image: "$image",
          price: "$price",
          quantity: "$quantity",
          discount: { $ifNull: ["$discount", 0] }, // Ensure discount defaults to 0 if it's null
          slug: "$slug",
          productGalleryImageUrls: {
            $arrayElemAt: ["$productGalleryImageUrls", 0],
          }, // Take only the first image URL
          createdAt: "$createdAt",
          salesStatus: {
            $cond: {
              if: { $gt: ["$quantity", 0] },
              then: "Sale",
              else: "unavailable",
            },
          },
        },
      },
      {
        $addFields: {
          discountPrice: {
            $cond: {
              if: {
                $or: [{ $eq: ["$discount", null] }, { $eq: ["$discount", 0] }],
              }, // If discount is null or 0
              then: null, // Set discountPrice to null
              else: {
                $subtract: [
                  "$price",
                  { $multiply: ["$price", { $divide: ["$discount", 100] }] }, // Calculate discounted price
                ],
              },
            },
          },
        },
      },
      {
        $project: {
          title: 1,
          image: 1,
          price: 1,
          discount: 1,
          discountPrice: 1,
          quantity: 1,
          slug: 1,
          productGalleryImageUrls: 1,
          createdAt: 1,
          salesStatus: 1,
        },
      },
      {
        $limit: productLength, // Limit the number of documents returned
      },
    ];

    // Execute aggregation pipeline
    const data = await Product.aggregate(pipeline);

    // Return response
    res.status(200).json({
      success: true,
      data,
      totalProducts,
      message: "Fetched products successfully!",
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

// search by product name

const searchByProductName = async (req, res) => {
  try {
    const { keyword, page = 1, limit = 10 } = req.query; // Default limit to 10 per page

    console.log("Search Query:", req.query); // Log the query parameters for debugging

    // Check if keyword exists and is not empty
    if (!keyword || keyword.trim() === "") {
      return res.status(400).json({ error: "Keyword is required for search." });
    }

    // Convert page and limit to numbers
    const parsedPage = parseInt(req.query.page) || 1;
    const parsedLimit = parseInt(limit);

    // Validate page and limit values
    if (isNaN(parsedPage) || parsedPage < 1) {
      return res.status(400).json({ error: "Invalid page number." });
    }

    if (isNaN(parsedLimit) || parsedLimit < 1) {
      return res.status(400).json({ error: "Invalid limit value." });
    }

    // Calculate skip based on page and limit
    const skip = (parsedPage - 1) * parsedLimit;

    // Perform a text search on the 'name' field using $regex and $options: 'i', with pagination
    const productsQuery = Product.find({
      name: { $regex: keyword, $options: "i" },
    })
      .select("name price quantity image slug")
      .skip(skip)
      .limit(parsedLimit);

    // Execute the query to get products
    const products = await productsQuery.exec();

    // Query to get total count of products matching the search criteria
    const totalProductsQuery = Product.countDocuments({
      name: { $regex: keyword, $options: "i" },
    });

    // Execute the query to get total count of products
    const totalProducts = await totalProductsQuery.exec();

    // Check if products array is empty
    if (products.length === 0) {
      return res.json({ products: [], totalProducts: 0 });

      // return res
      //   .status(404)
      //   .json({ message: "No products found.", products: [] });
    }

    // Send response with products and total count
    console.log(products);
    res.json({ products, totalProducts });
  } catch (err) {
    console.error("Error searching products:", err); // Log any errors for debugging
    res.status(500).json({ error: err.message });
  }
};

const getDeatailedProductCountByCategoryWise = async (req, res) => {
  try {
    // Step 1: Get counts for each subcategory
    const subcategoryCounts = await Product.aggregate([
      {
        $group: {
          _id: {
            parent_category_id: "$parent_category_id",
            category_id: "$category_id",
            subcategory_id: "$subcategory_id",
          },
          count: { $sum: 1 },
        },
      },
    ]);

    // Step 2: Get all parent categories
    const parentCategories = await productParentCategory.find().lean();

    // Step 3: Get all categories
    const categories = await productCategory.find().lean();

    // Step 4: Get all subcategories
    const subcategories = await SubCategory.find().lean();

    // Step 5: Build the result structure
    const result = parentCategories.reduce((acc, parentCat) => {
      acc[parentCat.slug] = {
        id: parentCat._id,
        slug: parentCat.slug,
        name: parentCat.name, // Include parent category name
        data: {},
        count: 0,
      };

      const relevantCategories = categories.filter(
        (cat) => cat.parentCategoryId.toString() === parentCat._id.toString()
      );

      relevantCategories.forEach((cat) => {
        acc[parentCat.slug].data[cat.slug] = {
          id: cat._id,
          slug: cat.slug,
          name: cat.name, // Include category name
          data: {},
          count: 0,
        };

        const relevantSubcategories = subcategories.filter(
          (subcat) => subcat.productCategoryId.toString() === cat._id.toString()
        );

        relevantSubcategories.forEach((subcat) => {
          const countData = subcategoryCounts.find(
            (sc) =>
              sc._id.parent_category_id.toString() ===
                parentCat._id.toString() &&
              sc._id.category_id.toString() === cat._id.toString() &&
              sc._id.subcategory_id.toString() === subcat._id.toString()
          );

          const count = countData ? countData.count : 0;

          acc[parentCat.slug].data[cat.slug].data[subcat.slug] = {
            id: subcat._id,
            slug: subcat.slug,
            name: subcat.name, // Include subcategory name
            count: count,
          };

          acc[parentCat.slug].data[cat.slug].count += count;
          acc[parentCat.slug].count += count;
        });
      });

      return acc;
    }, {});

    console.log(result);

    res.send({ success: true, data: result });
  } catch (error) {
    console.error("Error in getDeatailedProductCountByCategoryWise:", error);
    res.status(500).send({ success: false, error: "Internal server error" });
  }
};

const filterProducts = async (req, res) => {
  try {
    const {
      parentCat,
      productCat,
      subCat,
      searchKeyword,
      priceRange,
      stockStatus,
    } = req.body;
    console.log( productCat,
      subCat,
      searchKeyword,
      priceRange,
      stockStatus,)

    const { page = 1, pageSize = 9 } = req.query; // Default to page 1 and pageSize 9 if not provided

    console.log(req.query)
    // Build the query object
    let query = {};

    // Function to get IDs from slug
    const getIdsFromSlugs = async (slugArray, model) => {
      if (!slugArray || slugArray.length === 0 || slugArray.includes("All")) {
        return [];
      }
      const result = await model.find({ slug: { $in: slugArray } }).lean();
      return result.map((item) => item._id.toString());
    };

    // Fetch IDs for parent categories, product categories, and subcategories
    const parentCatIds = await getIdsFromSlugs(
      parentCat,
      productParentCategory
    );
    const productCatIds = await getIdsFromSlugs(productCat, productCategory);
    const subCatIds = await getIdsFromSlugs(subCat, SubCategory);

    // Filter by parent category IDs
    if (parentCatIds.length > 0) {
      query.parent_category_id = { $in: parentCatIds };
    }

    // Filter by product category IDs
    if (productCatIds.length > 0) {
      query.category_id = { $in: productCatIds };
    }

    // Filter by subcategory IDs
    if (subCatIds.length > 0) {
      query.subcategory_id = { $in: subCatIds };
    }

    // Filter by price range
    if (
      priceRange &&
      typeof priceRange.min === "number" &&
      typeof priceRange.max === "number"
    ) {
      query.price = { $gte: priceRange.min, $lte: priceRange.max };
    }

    // Filter by stock status
    if (stockStatus) {
      const stockConditions = [];
      if (stockStatus.inStock) {
        stockConditions.push({ quantity: { $gt: 0 } });
      }
      if (stockStatus.out_of_stock) {
        stockConditions.push({ quantity: 0 });
      }
      if (stockConditions.length > 0) {
        query.$or = stockConditions;
      }
    }

    // Filter by searchKeyword and productName
    if (searchKeyword) {
      query.$or = [
        { name: { $regex: searchKeyword, $options: "i" } },
        // Add more fields to search if needed, e.g., productDescription
      ];
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * pageSize;

    // Fetch the filtered products
    let products = await Product.find(query)
      .select(
        "_id name image price quantity productGalleryImageUrls discount slug createdAt"
      )
      .skip(skip)
      .limit(parseInt(pageSize))
      .lean()
      .exec();

    // Calculate discountPrice and include title (assuming title is the same as name)
    products = products.map((product) => {
      const discount = product.discount || 0;
      const price = product.price || 0;
      const discountPrice = discount ? price - (price * discount) / 100 : null;
      const firstImageUrl =
        product.productGalleryImageUrls.length > 0
          ? product?.productGalleryImageUrls[0]
          : null;
          const salesStatus = product.quantity > 0 ? "Sale" : "Unavailable";
      return {
        ...product,
        title: product.name, // Assuming title is the same as name
        discountPrice: discountPrice,
        productGalleryImageUrls: firstImageUrl,
        salesStatus:salesStatus,
      };
    });

    // Send the response
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Error fetching products", error });
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
  searchByProductName,
  getDeatailedProductCountByCategoryWise,
  filterProducts,
};
