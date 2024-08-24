// config/payuConfig.js
module.exports = {
  PAYU_MERCHANT_KEY: "RKdXZx",
  PAYU_MERCHANT_SALT: "S1VqEPZ98oXEXAUqWZC31GmOgonBjAYx",
  // PAYU_URL : "https://secure.payu.in/_payment", // Use the production URL
  PAYU_URL: "https://test.payu.in/_payment", 
  successUrl: "http://localhost:3000/api/payment/payment-success",
  failureUrl: "http://localhost:3000/api/payment/payment-failure",
};
