const { coupons } = require("../models/couponModel");

const createCoupon = async (req, res) => {
  try {
    const {
      code,
      description,
      type,
      discountAmount,
      minCartAmount,
      activeDate,
      expiryDate,
      maxUsageCount,
    } = req.body;

    // user checker start
    const decoded = req.decoded;

    const userEmail = decoded?.email;
    // user checker end

    console.log(userEmail, "created by")
    const parsedActiveDate = new Date(activeDate);
    const parsedExpiryDate = new Date(expiryDate);

    const newCoupon = new coupons({
      code,
      description,
      type,
      discountAmount: Number(discountAmount),
      minCartAmount,
      activeDate: parsedActiveDate,
      expiryDate: parsedExpiryDate,
      maxUsageCount,
      status: "pending",
      created_by: userEmail,
      usedBy: [],
    });

    const savedCoupon = await newCoupon.save();

    return res.status(201).json({
      message: "Coupon created successfully",
      data: savedCoupon,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//get all coupons
const getAllCoupons = async (req, res) => {
  try {
    // Retrieve all coupons, excluding the 'usedBy' field
    const allCoupons = await coupons.find({}, { usedBy: 0 }).exec();

    if (!allCoupons || allCoupons.length === 0) {
      return res.status(404).json({ error: "Coupons not found" });
    }

    res.status(200).json({
      message: "Coupons retrieved successfully",
      data: allCoupons,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateCouponById = async (req, res) => {
  try {
    const couponId = req.params.couponId;
    console.log(couponId, req.body);
    const {
      code,
      description,
      type,
      discountAmount,
      minCartAmount,
      activeDate,
      expiryDate,
      maxUsageCount,
    } = req.body;

    // user checker start
    const decoded = req.decoded;

    const userEmail = decoded?.email;
    // user checker end

    const updateData = {
      code,
      description,
      type,
      discountAmount: discountAmount && Number(discountAmount),
      minCartAmount,
      updated_by: userEmail,
      maxUsageCount,
      updatedAt: Date.now(), // Ensure updatedAt is also updated
    };

    // Parse dates if they are provided
    if (activeDate) {
      const parsedActiveDate = new Date(activeDate);
      if (isNaN(parsedActiveDate)) {
        return res.status(400).json({ error: "Invalid activeDate" });
      }
      updateData.activeDate = parsedActiveDate;
    }

    if (expiryDate) {
      const parsedExpiryDate = new Date(expiryDate);
      if (isNaN(parsedExpiryDate)) {
        return res.status(400).json({ error: "Invalid expiryDate" });
      }
      updateData.expiryDate = parsedExpiryDate;
    }

    console.log(updateData);
    const options = { new: true, upsert: false }; // Return the updated document

    const result = await coupons.findByIdAndUpdate(
      couponId,
      { $set: updateData },
      options
    );

    if (!result) {
      return res.status(404).json({ error: "Coupon not found" });
    }

    res.status(200).json({
      message: "Coupon updated successfully",
      data: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateCouponStatusById = async (req, res) => {
  try {
    const couponId = req.params.couponId;
    const { status } = req.body;
    console.log(status, couponId, "fsfsdf");

    // user checker start
    const decoded = req.decoded;

    const userEmail = decoded?.email;
    // user checker end

    // Ensure status is a valid enum value
    const validStatuses = ["approved", "pending", "disapproved"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const result = await coupons.findByIdAndUpdate(
      couponId,
      { $set: { status, updated_by: userEmail, updatedAt: Date.now() } }, // Ensure updatedAt is also updated
      { new: true } // Return the updated document
    );

    if (!result) {
      return res.status(404).json({ error: "Coupon not found" });
    }

    res.status(200).json({
      message: "Coupon status updated successfully",
      data: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteCouponById = async (req, res) => {
  try {
    const couponId = req.params.couponId;

    const result = await coupons.deleteOne({ _id: couponId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Coupon not found" });
    }

    res.status(200).json({
      message: "Coupon deleted successfully",
      data: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getUserAllCoupons = async (req, res) => {
  console.log("dsfdsfdsfsdfdsfdsdsddf");
  try {
    const userEmail = req.query.email;
    console.log("Email:", userEmail);

    const currentDate = new Date();

    const couponsData = await coupons
      .find({
        status: "approved",
        activeDate: { $lte: currentDate },
        expiryDate: { $gte: currentDate },
      })
      .sort({ expiryDate: -1 })
      .select("-activeDate") // Exclude type and activeDate fields
      .lean(); // Convert Mongoose documents to plain JavaScript objects

    console.log(couponsData, "fdsfsdfsdf");
    if (!couponsData || couponsData.length === 0) {
      return res.status(404).json({ error: "No valid coupons found" });
    }

    const userUsedCoupons = couponsData.map((coupon) => {
      const filteredUsedBy = coupon.usedBy
        ? coupon.usedBy.filter((user) => user.email === userEmail)
        : [];

      const isUsed = filteredUsedBy.some(
        (user) => parseInt(user.usageCount) >= parseInt(coupon.maxUsageCount)
      );

      return { ...coupon, isUsed: isUsed, usedBy: filteredUsedBy };
    });

    const userUsedCouponsResult = userUsedCoupons?.filter(
      (coupon) => coupon?.isUsed === false
    );

    res.status(200).json({
      message: "Coupons retrieved successfully",
      data: userUsedCouponsResult,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  createCoupon,
  getAllCoupons,
  updateCouponById,
  updateCouponStatusById,
  deleteCouponById,
  getUserAllCoupons,
};
