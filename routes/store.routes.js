const { getAllStores } = require("../controllers/storeController");

const storeRoute = require("express").Router();
const upload = require("multer")();

// create blog category
storeRoute.get("/", getAllStores); // view all blogs

module.exports = { storeRoute };
