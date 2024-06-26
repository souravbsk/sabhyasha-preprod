const { default: mongoose } = require("mongoose");

const couponModel = new mongoose.Schema({
  code: {
    type: String,
    required: true,
  },
  description: String,
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  updatedAt: {
    type: Date,
    default: Date.now(),
  },
  // author: {
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: "Admin",
  //   required: true,
  // },
  usedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  activeDate: {
    type: Date,
    required: true,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  minCartAmount: Number,
  type: {
    type: String,
    required: true,
    enum: ["percentage", "amount"],
  },
  discountAmount: {
    type: Number,
    required: true,
  },
  maxUsageCount: Number,
  status: {
    type: String,
    required: true,
    enum: ["approved", "pending","disapproved"],
  },
});

couponModel.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const coupons = mongoose.model("coupons", couponModel);

module.exports = { coupons };
