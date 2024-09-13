// config/payuConfig.js
require("dotenv").config();

module.exports = {
  PAYU_MERCHANT_KEY: "RKdXZx",
  PAYU_MERCHANT_SALT: "S1VqEPZ98oXEXAUqWZC31GmOgonBjAYx",
  // PAYU_URL : "https://secure.payu.in/_payment", // Use the production URL
  PAYU_URL: "https://test.payu.in/_payment",
  successUrl: `${process.env.NODE_SERVER}/api/order/payment-success`,
  failureUrl: `${process.env.NODE_SERVER}/api/order/payment-failure`,
};
