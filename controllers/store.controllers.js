const { Stores } = require("../models/storeModel");

const getAllStores = async (req, res) => {
  try {
    const storeResult = await Stores.find({}, { _id: 1, name: 1 }).lean();

    res.status(200).json({ success: true, data: storeResult });
  } catch (error) {
    console.error("Error fetching stores:", error.message);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};
module.exports = { getAllStores };
