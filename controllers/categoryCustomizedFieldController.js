const { default: mongoose } = require("mongoose");
const { customizedFields } = require("../models/customizationModel");
const { ObjectId } = require("mongodb");

const createCategoryCustomizedField = async (req, res) => {
  try {
    const customizedFieldData = req.body;
    console.log(customizedFieldData);

    // Insert the customized field data into the MongoDB collection using Mongoose
    const insertedCustomizedFields = await customizedFields.insertMany(
      customizedFieldData,
      { ordered: true }
    );

    if (!insertedCustomizedFields) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.status(201).json({
      success: true,
      message: "Category Customized Field created successfully",
      data: insertedCustomizedFields,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getAllCustomizeFields = async (req, res) => {
  try {
    const customizedData = await customizedFields.find({});

    if (!customizedData || customizedData.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.status(200).json({
      success: true,
      message: "Category Customized Fields retrieved successfully",
      data: customizedData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteCategoryCustomizedFieldById = async (req, res) => {
  try {
    const customizedId = req.params.customizedId;


    // Ensure the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(customizedId)) {
      return res.status(400).json({ error: "Invalid field ID" });
    }
    const filter = new ObjectId(customizedId)

    const result = await customizedFields.deleteOne(filter);

    if (!result) {
      return res.status(404).json({ error: "Customized Field not found" });
    }

    res.status(200).json({
      message: "Customized Field deleted successfully",
      data: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  createCategoryCustomizedField,
  getAllCustomizeFields,
  deleteCategoryCustomizedFieldById,
};
