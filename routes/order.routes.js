const {
  paymentSuccess,
  paymentFailure,
  createOrderWithPayment,
  getOrderSummaryAfterPay,
  getOrderStatus,
  getInvoice,
} = require("../controllers/order.controllers");
const { verifyJwt } = require("../middlewares/verifyJWT");

const orderRoute = require("express").Router();

// create blog category

orderRoute.post("/create-order-with-payment", createOrderWithPayment);
orderRoute.post("/payment-success", paymentSuccess);
orderRoute.post("/payment-failure", paymentFailure);
orderRoute.get("/order-summary", getOrderSummaryAfterPay);
orderRoute.get("/order-status", getOrderStatus);
module.exports = { orderRoute };
