const { getAllStores } = require("../controllers/store.controllers.js");

const storeRoute = require("express").Router();
const upload = require("multer")();

// create blog category
storeRoute.get("/", getAllStores); // view all blogs

module.exports = { storeRoute };
