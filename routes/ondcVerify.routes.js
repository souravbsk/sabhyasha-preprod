const {
  serveVerificationFile,
  healthCheck,
  onSubscribe,
  handleCallback,
} = require("../controllers/ondcVerify.controllers.js");

const ondcVerifyRoute = require("express").Router();

// create blog category

ondcVerifyRoute.post("/on_subscribe", onSubscribe);
ondcVerifyRoute.get("/ondc-site-verification", serveVerificationFile);
ondcVerifyRoute.get("/health", healthCheck);
ondcVerifyRoute.post("/callback", handleCallback);
module.exports = { ondcVerifyRoute };
