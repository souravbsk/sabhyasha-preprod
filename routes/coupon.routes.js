const {
  createCoupon,
  getAllCoupons,
  updateCouponById,
  updateCouponStatusById,
  deleteCouponById,
  getUserAllCoupons,
} = require("../controllers/coupon.controllers.js");

const couponRoute = require("express").Router();
const upload = require("multer")();

couponRoute.post("/create", upload.any(), createCoupon); // create blog category
couponRoute.get("/", getAllCoupons); // view all blogs
couponRoute.put("/:couponId", upload.any(), updateCouponById); // get blogs by category
couponRoute.patch("/:couponId", upload.any(), updateCouponStatusById); // get blogs by category
couponRoute.get("/usersCoupon", getUserAllCoupons); // get blog by slug
couponRoute.delete("/:couponId", deleteCouponById); // remove blog

module.exports = { couponRoute };
