const {
  initiatePayment,
  paymentSuccess,
  paymentFailure,
} = require("../controllers/payment.controllers");

const paymentRoute = require("express").Router();

// create blog category

paymentRoute.post("/initiate-payment", initiatePayment);
paymentRoute.post("/payment-success", paymentSuccess);
paymentRoute.post("/payment-failure", paymentFailure);
module.exports = { paymentRoute };
