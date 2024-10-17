const {
  serveVerificationFile,
  healthCheck,
  onSubscribe,
} = require("../controllers/ondcVerify.controllers.js");

const ondcVerifyRoute = require("express").Router();

// create blog category

ondcVerifyRoute.post("/on_subscribe", onSubscribe);
ondcVerifyRoute.get("/ondc-site-verification.html", serveVerificationFile);
ondcVerifyRoute.get("/health", healthCheck);

module.exports = { ondcVerifyRoute };
