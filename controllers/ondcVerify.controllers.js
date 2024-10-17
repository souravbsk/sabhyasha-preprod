const fs = require("fs");
const crypto = require("crypto"); // Node.js crypto module for encryption and decryption

const { decryptAES256ECB } = require("../services/cryptography.service");
//ondc key start
const ENCRYPTION_PRIVATE_KEY =
  "MC4CAQEwBQYDK2VuBCIEILgcht9h660ZeO36tG+QuHGNcLN9JuAzxHWZl09f57Bh";
const ONDC_PUBLIC_KEY =
  "MCowBQYDK2VuAyEAlKHWJWiEiHFGlAJ6TE4VMGaeQUYg5DHEpuQdiq6flnQ=";
const REQUEST_ID = "6a6abf53-674f-4d6d-a52b-62e3fda55e04";
const SIGNING_PRIVATE_KEY =
  "7M2L3q9y5gS/dq21Ly3Y3VtYEwgmGM1tM4n0wce/WgcJcOzvdfKo+AUEulIyQCawS39dc6uicu8NAaEpciPajg==";
// ondc key end

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

const serveVerificationFile = async  (req, res) => {
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
}



// Health check
function healthCheck(req, res) {
    res.send('Health OK!!');
  }


module.exports = {
  onSubscribe,
  serveVerificationFile,
  healthCheck,
};
