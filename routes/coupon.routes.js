const {
  createCoupon,
  getAllCoupons,
  updateCouponById,
  updateCouponStatusById,
  deleteCouponById,
  getUserAllCoupons,
} = require("../controllers/coupon.controllers.js");
const { verifyAdmin } = require("../middlewares/verifyAdmin.js");
const { verifyJwt } = require("../middlewares/verifyJWT.js");

const couponRoute = require("express").Router();
const upload = require("multer")();

couponRoute.post("/create", verifyJwt, verifyAdmin, upload.any(), createCoupon); // create coupon category
couponRoute.get("/", getAllCoupons); // view all coupons
couponRoute.put(
  "/:couponId",
  verifyJwt,
  verifyAdmin,
  upload.any(),
  updateCouponById
); // get coupons by category
couponRoute.patch(
  "/:couponId",
  verifyJwt,
  verifyAdmin,
  upload.any(),
  updateCouponStatusById
); // get coupons by category
couponRoute.get("/usersCoupon", getUserAllCoupons); // get coupon by slug
couponRoute.delete("/:couponId", verifyJwt, verifyAdmin, deleteCouponById); // remove coupon

module.exports = { couponRoute };
