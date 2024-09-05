const mongoose = require("mongoose");
const OrderShippingStatus = require("./orderShippingStatus.model");

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  invoice_no: {
    type: Number,
  },
  invoice_prefix: {
    type: String,
    default: "",
  },
  invoice_suffix: {
    type: String,
  },

  email: {
    type: String,
    required: true, // Ensure every order has an email
    index: true,
  },
  order_status_by_mail: {
    type: Boolean,
    require: true,
    default: false,
  },

  products: [
    {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products",
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      slug: {
        type: String,
        require: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      shippingCost: {
        included: {
          type: Boolean,
          default: false,
        },
        cost: {
          type: Number,
          default: null,
        },
      },
      priceWithDiscount: {
        type: Number,
        default: 0.0,
      },
    },
  ],
  paymentInfo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "paymentTransaction",
    required: true,
  },
  billingAddress: {
    country: { type: String, required: true },
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    address: { type: String, required: true },
    apartment: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postal_code: { type: String, required: true },
    mobile: { type: String, required: true },
  },
  shippingAddress: {
    country: { type: String, required: true },
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    address: { type: String, required: true },
    apartment: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postal_code: { type: String, required: true },
    mobile: { type: String, required: true },
  },
  amount: {
    type: Number,
    required: true,
    default: 0.0,
  },
  subTotal: {
    type: Number,
    required: true,
    default: 0.0,
  },
  discountAmount: {
    type: Number,
    default: 0.0,
  },
  couponAmount: {
    type: Number,
    default: 0.0,
  },
  status: {
    type: String,
    required: true,
    enum: [
      "pending",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
      "refunded",
    ],
    default: "pending",
    index: true,
    set: (v) => v.toLowerCase(),
  },

  shippingStatusId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "orderShippingStatus",
    required: true,
    index: true,
  },

  orderDate: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "failed", "success"],
    default: "pending",
    set: (v) => v.toLowerCase(),
  },
  trackingNumber: {
    type: String,
    unique: true,
    sparse: true,
  },
  coupon: {
    code: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      default: "",
    },
    discountAmount: {
      type: Number,
      default: 0.0,
    },
    minCartAmount: {
      type: Number,
      default: 0.0,
    },
  },
  orderNotes: {
    type: String,
    default: "",
  },
});

// Middleware to update the `updatedAt` field on every save
orderSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Compound index for user and status queries
orderSchema.index({ userId: 1, status: 1 });

const Order = mongoose.model("order", orderSchema);

module.exports = { Order };
