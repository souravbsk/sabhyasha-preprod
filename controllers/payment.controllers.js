// controllers/paymentController.js
const crypto = require("crypto");
const payuConfig = require("../config/payuConfig");
const { PaymentTransaction } = require("../models/paymentTransaction.model");

function generateHash(data, salt) {
  const hashString = `${data.key}|${data.txnid}|${data.amount}|${data.productinfo}|${data.firstname}|${data.email}|${data.udf1}|${data.udf2}|${data.udf3}|${data.udf4}|${data.udf5}|${data.udf6}|${data.udf7}|${data.udf8}|${data.udf9}|${data.udf10}|${salt}`;
  console.log("print:", hashString);
  return crypto.createHash("sha512").update(hashString).digest("hex");
}

const initiatePayment = async (req, res) => {
  const { amount, productInfo, firstName,  email, phone, lastName, shipping, billing,discount } = req.body;

  if (!amount || !productInfo || !firstName || !email || !phone) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const txnid = "Txn" + new Date().getTime();

  const requestData = {
    key: payuConfig.PAYU_MERCHANT_KEY,
    txnid: txnid,
    amount: amount,
    productinfo: productInfo,
    firstname: firstName,
    email: email,
    phone: phone,
    udf1: "",
    udf2: "",
    udf3: "",
    udf4: "",
    udf5: "",
    udf6: "",
    udf7: "",
    udf8: "",
    udf9: "",
    udf10: "",
  };

  const salt = payuConfig.PAYU_MERCHANT_SALT;
  const hash = generateHash(requestData, salt);

  const paymentData = {
    key: requestData.key,
    txnid: requestData.txnid,
    amount: requestData.amount,
    productinfo: requestData.productinfo,
    firstname: requestData.firstname,
    lastname: requestData.lastname,
    email: requestData.email,
    phone: requestData.phone,
    surl: "http://localhost:3000/api/payment/payment-success",
    furl: "http://localhost:3000/api/payment/payment-failure",
    udf1: payuConfig.udf1,
    udf2: payuConfig.udf2,
    udf3: payuConfig.udf3,
    udf4: payuConfig.udf4,
    udf5: payuConfig.udf5,
    udf6: payuConfig.udf6,
    udf7: payuConfig.udf7,
    udf8: payuConfig.udf8,
    udf9: payuConfig.udf9,
    udf10: payuConfig.udf10,
    hash: hash,
    // service_provider: "payu_paisa",
  };

  try {
    console.log("Payment Data:", paymentData);
    res
      .status(200)
      .json({ success: true, paymentData, payuUrl: payuConfig.PAYU_URL });
  } catch (err) {
    console.error("Error initiating payment:", err);
    res.status(500).json({ error: "Failed to initiate transaction" });
  }
};


const paymentSuccess = async (req, res) => {
  console.log(req.body, "hello world");
  const { txnid, amount, productinfo, firstname, email, status, hash } =
    req.body;
  const salt = payuConfig.PAYU_MERCHANT_SALT;


  try {
    // Fetch and update the transaction record in your database
    const transaction = await PaymentTransaction.findOneAndUpdate(
      { txnid: txnid },
      { status: status, payment_info: req.body },
      { new: true }
    );

    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    if (status === "success") {
      // Perform any additional processing like updating the order status
      console.log(`Transaction ${txnid} was successful. Amount: ₹${amount}`);
    } else {
      console.log(`Transaction ${txnid} failed. Status: ${status}`);
    }

    res.redirect("https://www.sabhyasha.com");
  } catch (err) {
    console.error("Error processing payment success:", err);
    res.status(500).json({ error: "Failed to process payment success" });
  }
};

const paymentFailure = async (req, res) => {
  console.log("hello failure");
  const response = req.body;
  await PaymentTransaction.findOneAndUpdate(
    { txnid: response.txnid },
    { status: "Failed" },
    { new: true }
  );
  res.redirect("/payment-failure-page");
};

module.exports = {
  initiatePayment,
  paymentSuccess,
  paymentFailure,
};
