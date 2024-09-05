const crypto = require("crypto");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();
const jwt = require("jsonwebtoken");


const generateHash = (data, salt) => {
  const hashString = `${data.key}|${data.txnid}|${data.amount}|${data.productinfo}|${data.firstname}|${data.email}|${data.udf1}|${data.udf2}|${data.udf3}|${data.udf4}|${data.udf5}|${data.udf6}|${data.udf7}|${data.udf8}|${data.udf9}|${data.udf10}|${salt}`;
  console.log("print:", hashString);
  return crypto.createHash("sha512").update(hashString).digest("hex");
};

const generateOrderId = () => {
  const uniqueId = uuidv4();
  return `ORD-${uniqueId}`;
};

const generateTrackingNumber = () => {
  const uniqueId = uuidv4();
  return `TRK-${uniqueId}`;
};

const generateInvoiceNumber = (count) => {
  const toDay = new Date();
  const year = toDay.getFullYear().toString().slice(-2);

  const month = new Intl.DateTimeFormat("en", { month: "2-digit" }).format(
    toDay
  );

  const formattedNumber = count?.toString().padStart(4, "0");
  const invoicePrefix = `SB${year}-${month}-`;
  const invoiceNumber = Number(formattedNumber) + 1;
  return { invoicePrefix, invoiceNumber };
};

const generateJwtTokenWithOrderId = (order) => {
  process.env.ACCESS_TOKEN_SECRET;
  const token = jwt.sign(
    { orderId: order?.orderId },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "1h",
    }
  );
  return token;
};

const verifyJwtOrderId = (token) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        return reject({ success: false, error: "Unauthorized access" });
      }

      const orderId = decoded?.orderId;
      resolve(orderId);
    });
  });
};


module.exports = {
  generateOrderId,
  generateHash,
  generateTrackingNumber,
  generateInvoiceNumber,
  generateJwtTokenWithOrderId,
  verifyJwtOrderId,
};
