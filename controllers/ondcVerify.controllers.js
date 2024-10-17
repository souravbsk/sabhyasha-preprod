const fs = require("fs");
const crypto = require("crypto"); // Node.js crypto module for encryption and decryption

const { decryptAES256ECB } = require("../services/cryptography.service");
//ondc key start
const ENCRYPTION_PRIVATE_KEY =
  "MC4CAQAwBQYDK2VuBCIEIJhfqUaxAftJvdlORgzpat74H2NNlOm2GrQOHt1NQs1l";
const ONDC_PUBLIC_KEY =
  "MCowBQYDK2VuAyEAlKHWJWiEiHFGlAJ6TE4VMGaeQUYg5DHEpuQdiq6flnQ=";
const REQUEST_ID = "6a6abf53-674f-4d6d-a52b-62e3fda55e04";
const SIGNING_PRIVATE_KEY =
  "jdulrz8+zSnz3+1jFZo/KpJl8zDdple1Dpvqm2eyeDC0a4Yyr4oVJg4mbWw7jwHTuVIaOX9F7g7wVl105XUdyA==";
// ondc key end

// {
//   Signing_private_key: 'jdulrz8+zSnz3+1jFZo/KpJl8zDdple1Dpvqm2eyeDC0a4Yyr4oVJg4mbWw7jwHTuVIaOX9F7g7wVl105XUdyA==',
//   Signing_public_key: 'tGuGMq+KFSYOJm1sO48B07lSGjl/Re4O8FZddOV1Hcg=',
//   Encryption_Privatekey: 'MC4CAQAwBQYDK2VuBCIEIJhfqUaxAftJvdlORgzpat74H2NNlOm2GrQOHt1NQs1l',
//   Encryption_Publickey: 'MCowBQYDK2VuAyEA9NxuiVMS+Q66NIuIDz0yEy/5vkHpjcbCTx+VtI8kDA4='
// } key pairs


// __________________________________________________________________________________

// Pre-defined public and private keys
const privateKey = crypto.createPrivateKey({
  key: Buffer.from(ENCRYPTION_PRIVATE_KEY, "base64"), // Decode private key from base64
  format: "der", // Specify the key format as DER
  type: "pkcs8", // Specify the key type as PKCS#8
});
const publicKey = crypto.createPublicKey({
  key: Buffer.from(ONDC_PUBLIC_KEY, "base64"), // Decode public key from base64
  format: "der", // Specify the key format as DER
  type: "spki", // Specify the key type as SubjectPublicKeyInfo (SPKI)
});

// Calculate the shared secret key using Diffie-Hellman
const sharedKey = crypto.diffieHellman({
  privateKey: privateKey,
  publicKey: publicKey,
});

// Handle subscription requests

const onSubscribe = async (req, res) => {
  try {
    const { challenge } = req.body; // Extract the 'challenge' property from the request body
    const answer = decryptAES256ECB(sharedKey, challenge); // Decrypt the challenge using AES-256-ECB
    const resp = { answer: answer };
    res.status(200).json(resp); // Send a JSON response with the answer
  } catch (error) {
    res.status(500).json({ error: "Decryption failed" });
  }
};

// Serve ONDC site verification file

const serveVerificationFile = async (req, res) => {
  try {
    const signedContent = await signMessage(REQUEST_ID, SIGNING_PRIVATE_KEY);
    // Replace the placeholder with the actual value
    const htmlFile = fs.readFileSync(
      "../views/ondc-site-verification.html",
      "utf-8"
    );
    const modifiedHTML = htmlFile.replace(
      /SIGNED_UNIQUE_REQ_ID/g,
      signedContent
    );
    // Send the modified HTML as the response
    res.send(modifiedHTML);
  } catch (error) {
    res.status(500).json({ error: "Verification failed" });
  }
};

// Health check
function healthCheck(req, res) {
  res.send("Health OK!!");
}

const handleCallback = (req, res) => {
  try {
    const callbackData = req.body; // Extract callback data from the request
    // Process the callback data (e.g., update subscription status, handle errors, etc.)

    // Example: Log the callback data
    console.log("Received ONDC callback:", callbackData);

    // Send a response back to ONDC
    res.status(200).json({ message: "Callback received successfully" });
  } catch (error) {
    console.error("Error processing ONDC callback:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  onSubscribe,
  serveVerificationFile,
  handleCallback,
  healthCheck,
};
