const {
  getAllShippingAddress,
} = require("../controllers/checkout.controllers.js");

const checkoutRoute = require("express").Router();
const upload = require("multer")();

checkoutRoute.get("/user/shippingaddress", getAllShippingAddress); // view all blogs

module.exports = { checkoutRoute };
