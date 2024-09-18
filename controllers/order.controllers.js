// controllers/order.controller.js
const crypto = require("crypto");
const payuConfig = require("../config/payuConfig");
const { PaymentTransaction } = require("../models/paymentTransaction.model");
const {
  generateHash,
  generateOrderId,
  generateTrackingNumber,
  generateInvoiceNumber,
  generateJwtTokenWithOrderId,
  verifyJwtOrderId,
} = require("../utlis/orderUtils");
const { Order } = require("../models/order.model");
const jwt = require("jsonwebtoken");
const { users } = require("../models/userModel");
const { Product } = require("../models/productModel");
const { carts } = require("../models/cartModel");
const OrderHistory = require("../models/orderHistory.model");
const OrderShippingStatus = require("../models/orderShippingStatus.model");
const { default: mongoose } = require("mongoose");
const { sendMail } = require("../utlis/emailUtils");
require("dotenv").config();

//create order with payment
const createOrderWithPayment = async (req, res) => {
  try {
    const {
      amount,
      products,
      firstName,
      email,
      order_status_by_mail,
      phone,
      lastName,
      shipping_info,
      billing_info,
      discount,
      couponAmount,
      coupon,
      totalAmount,
    } = req.body;

    if (!amount || !products || !firstName || !email || !phone) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Generate unique IDs
    const orderId = generateOrderId();
    const trackingId = generateTrackingNumber();
    const txnid = "Txn" + new Date().getTime();

    console.log(orderId, trackingId, "orderId , trackingId , txnid");

    // Prepare product info
    const productInfo = products
      ?.map(
        (item) =>
          `${item?.name} (ID: ${item?._id}, Qty: ${item?.quantity}, Price: ${item?.price} DiscountPrice: ${item?.priceWithDiscount}) `
      )
      .join(", ");

    const requestData = {
      key: payuConfig.PAYU_MERCHANT_KEY,
      txnid: txnid,
      amount: amount,
      productinfo: productInfo,
      firstname: firstName,
      lastname: lastName,
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
    //generate hash
    const hash = generateHash(requestData, salt);

    const paymentTransaction = new PaymentTransaction({
      txnid: txnid,
      orderid: orderId,
      amount: amount,
      productinfo: productInfo,
      firstname: firstName,
      lastname: lastName,
      email: email,
      phone: phone,
      hash: hash,
    });

    const savedPaymentTransaction = await paymentTransaction.save();

    const statusName = "pending";
    const shippingStatus = await OrderShippingStatus.findOne({
      status: new RegExp(`^${statusName}$`, "i"), // Case-insensitive search
    });

    console.log(shippingStatus, "shipping status");
    const order = new Order({
      orderId: orderId,

      email: email,
      order_status_by_mail: order_status_by_mail,
      products: products,
      paymentInfo: savedPaymentTransaction._id,
      billingAddress: billing_info,
      shippingAddress: shipping_info,
      amount: amount,
      discountAmount: discount,
      trackingNumber: trackingId,
      couponAmount: couponAmount,
      shippingStatusId: shippingStatus?._id,
      coupon: coupon,
      subTotal: totalAmount,
      orderNotes: "",
    });

    const newOrder = await order.save();
    console.log(newOrder, "newOrder");

    const paymentData = {
      key: requestData.key,
      txnid: requestData.txnid,
      amount: requestData.amount,
      productinfo: requestData.productinfo,
      firstname: requestData.firstname,
      lastname: requestData.lastname,
      email: requestData.email,
      phone: requestData.phone,
      address1: billing_info.address,
      address2: billing_info.apartment,
      city: billing_info.city,
      state: billing_info.state,
      country: billing_info.country,
      zipcode: billing_info.postal_code,
      discount: discount,
      surl: payuConfig.successUrl,
      furl: payuConfig.failureUrl,
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
    };

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
  console.log("Payment Success Payload:", req.body);

  const {
    mihpayid,
    mode,
    status,
    txnid,
    hash,
    amount,
    payment_source,
    meCode,
    PG_TYPE,
    bank_ref_num,
    bankcode,
    error,
    error_Message,
    cardnum,
    address1,
    address2,
    city,
    state,
    country,
    zipcode,
    net_amount_debit,
    addedon,
    cardCategory,
    productinfo,
    firstname,
    email,
  } = req.body;

  console.log(productinfo, firstname, email, "Processing payment success");

  // Start a session for transaction management
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Find and update the transaction record
    const transaction = await PaymentTransaction.findOneAndUpdate(
      { txnid },
      {
        mihpayid,
        mode,
        status,
        hash,
        amount,
        payment_source,
        meCode,
        PG_TYPE,
        bank_ref_num,
        bankcode,
        error,
        error_Message,
        cardnum,
        address1,
        address2,
        city,
        state,
        country,
        zipcode,
        net_amount_debit,
        addedon,
        cardCategory,
      },
      { new: true, session }
    );

    if (!transaction) {
      throw new Error(`Transaction with txnid ${txnid} not found.`);
    }

    // Proceed only if payment was successful
    if (status.toLowerCase() === "success") {
      // Generate invoice number
      const orderCount = await Order.countDocuments({
        paymentStatus: "success",
      });
      const { invoicePrefix, invoiceNumber } =
        generateInvoiceNumber(orderCount);

      // Update the order status and invoice details
      const order = await Order.findOneAndUpdate(
        { orderId: transaction.orderid },
        {
          paymentStatus: "success",
          status: "confirmed",
          invoice_no: invoiceNumber,
          invoice_prefix: invoicePrefix,
        },
        { new: true, session }
      );

      if (!order) {
        throw new Error(`Order with orderId ${transaction.orderid} not found.`);
      }

      const statusName = "pending";
      const shippingStatus = await OrderShippingStatus.findOne({
        status: new RegExp(`^${statusName}$`, "i"), // Case-insensitive search
      });

      // Create an order history entry
      await OrderHistory.create(
        [
          {
            orderId: order._id,
            paymentTransactionId: transaction._id,
            email: email,
            shippingStatusId: shippingStatus?._id,
          },
        ],
        { session }
      );

      // Update user data if the user exists
      const userData = await users.findOneAndUpdate(
        { email },
        {
          $addToSet: {
            productsBought: { $each: order.products.map((p) => p._id) },
          },
        },
        { new: true, upsert: false, session }
      );

      if (userData && userData._id) {
        // Clear cart data for the user
        await carts.deleteMany({ userId: userData._id }, { session });
      }

      // Update the purchased_count in the products collection
      const productUpdates = order.products.map((product) => ({
        updateOne: {
          filter: { _id: product._id },
          update: { $inc: { purchased_count: product.quantity } },
        },
      }));
      await Product.bulkWrite(productUpdates, { session });

      console.log(
        `Payment success: Transaction ${txnid} was successful. Order ${order.orderId} confirmed.`
      );

      // Commit the transaction
      await session.commitTransaction();

      res.redirect(
        `${process.env.DOMAIN}/checkout/order-received/?orderId=${order?.orderId}`
      );
    } else {
      console.log(
        `Payment failed: Transaction ${txnid} failed with status ${status}.`
      );
      res.status(400).json({ error: `Payment failed with status ${status}` });
    }
  } catch (err) {
    console.error("Error processing payment success:", err);

    // Abort the transaction in case of an error
    await session.abortTransaction();
    res.status(500).json({ error: "Failed to process payment success" });
  } finally {
    // End the session
    session.endSession();
  }
};
const paymentFailure = async (req, res) => {
  console.log("Payment Failure Payload:", req.body);
  const decoded = req.decoded;
  console.log(decoded, "decoded");

  const {
    txnid,
    mihpayid,
    mode,
    status,
    hash,
    amount,
    payment_source,
    meCode,
    PG_TYPE,
    bank_ref_num,
    bankcode,
    error,
    error_Message,
    cardnum,
    address1,
    address2,
    city,
    state,
    country,
    zipcode,
    net_amount_debit,
    addedon,
    cardCategory,
  } = req.body;

  try {
    // Find and update the transaction record based on the txnid
    const transaction = await PaymentTransaction.findOneAndUpdate(
      { txnid: txnid },
      {
        mihpayid,
        mode,
        status,
        hash,
        amount,
        payment_source,
        meCode,
        PG_TYPE,
        bank_ref_num,
        bankcode,
        error,
        error_Message,
        cardnum,
        address1,
        address2,
        city,
        state,
        country,
        zipcode,
        net_amount_debit,
        addedon,
        cardCategory,
      },
      { new: true } // Return the updated document
    );

    if (!transaction) {
      console.error(`Transaction with txnid ${txnid} not found.`);
      return res.status(404).json({ error: "Transaction not found" });
    }

    // Update the order status to 'failed' if the payment failed
    const order = await Order.findOneAndUpdate(
      { orderId: transaction.orderid },
      { paymentStatus: "failed", status: "cancelled" },
      { new: true }
    );

    if (!order) {
      console.error(`Order with orderId ${transaction.orderid} not found.`);
      return res.status(404).json({ error: "Order not found" });
    }

    console.log(
      `Payment failure: Transaction ${txnid} failed. Order ${order.orderId} cancelled.`
    );

    // Redirect the user to the payment failure page
    res.redirect(
      `${process.env.DOMAIN}/checkout/order-received?orderId=${order?.orderId}`
    );
  } catch (err) {
    console.error("Error processing payment failure:", err);
    res.status(500).json({ error: "Failed to process payment failure" });
  }
};

const getOrderSummaryAfterPay = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    console.log(orderId);

    if (!orderId) {
      return res
        .status(400)
        .json({ success: false, error: "Order ID is required" });
    }

    const orderDetails = await Order.findOne({ orderId: orderId });
    console.log(orderDetails);

    if (!orderDetails) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    console.log({
      success: true,
      orderDetails,
      orderPaymentStatus: orderDetails?.paymentStatus,
    });

    return res.status(200).json({
      success: true,
      orderDetails,
      orderPaymentStatus: orderDetails?.paymentStatus,
    });
  } catch (error) {
    console.error("Error fetching order summary:", error);
    if (error?.error === "Unauthorized access") {
      return res.status(401).json(error);
    }
    return res
      .status(500)
      .json({ success: false, error: "Failed to process payment success" });
  }
};

const getOrderStatus = async (req, res) => {
  try {
    const statusName = "pending";
    const shippingStatus = await OrderShippingStatus.findOne({
      status: new RegExp(`^${statusName}$`, "i"), // Case-insensitive search
    });

    return res.status(200).json({
      success: true,
      shippingStatus,
    });
  } catch (error) {
    console.error("Error fetching order summary:", error);
    if (error?.error === "Unauthorized access") {
      return res.status(401).json(error);
    }
    return res
      .status(500)
      .json({ success: false, error: "Failed to process payment success" });
  }
};

// const sendEmailUser = async (req, res) => {
//   try {
//     const to = "souravbsk01@gmail.com";
//     const subject = "test-email";
//     const body = {
//       text: "hello world",
//     };

//     const result = await sendMail(to, subject, body);
//     console.log(result);
//     res.send("hello");
//   } catch (error) {
//     console.error("Error fetching order summary:", error);
//     if (error?.error === "Unauthorized access") {
//       return res.status(401).json(error);
//     }
//     return res
//       .status(500)
//       .json({ success: false, error: "Failed to process payment success" });
//   }
// };

//order controller for user panel
const getUserOrderHistory = async (req, res) => {
  try {
    const email = "sb07008@gmail.com";

    // Define the aggregation pipeline
    const pipeline = [
      // Match OrderHistory by email
      {
        $match: {
          email: email,
        },
      },
      // Lookup to join with Order collection
      {
        $lookup: {
          from: "orders", // The name of the Order collection
          localField: "orderId",
          foreignField: "_id", // Assuming orderId in OrderHistory matches _id in Order
          as: "orderDetails",
        },
      },
      // Unwind the orders array to deconstruct the array elements
      {
        $unwind: {
          path: "$orderDetails",
          preserveNullAndEmptyArrays: true, // If there are OrderHistory entries with no matching orders
        },
      },
      // Lookup to join with OrderShippingStatus collection
      {
        $lookup: {
          from: "orderShippingStatus", // The name of the OrderShippingStatus collection
          localField: "shippingStatusId",
          foreignField: "_id", // Assuming shippingStatusId in OrderHistory matches _id in OrderShippingStatus
          as: "shippingStatusDetails",
        },
      },
      // Unwind the shipping status array to deconstruct the array elements
      {
        $unwind: {
          path: "$shippingStatusDetails",
          preserveNullAndEmptyArrays: true, // If there are OrderHistory entries with no matching shipping status
        },
      },
      // Project specific fields
      {
        $project: {
          _id: 1,
          orderId: 1,
          email: 1,
          paymentTransactionId: 1,

          "orderDetails._id": 1, // Include all other fields from orderDetails
          "orderDetails.orderId": 1, // Include all other fields from orderDetails
          "orderDetails.invoice_prefix": 1, // Include all other fields from orderDetails
          "orderDetails.email": 1, // Include all other fields from orderDetails
          "orderDetails.products": 1, // Include all other fields from orderDetails
          "orderDetails.billingAddress": 1, // Include all other fields from orderDetails
          "orderDetails.paymentInfo": 1, // Include all other fields from orderDetails
          "orderDetails.shippingAddress": 1, // Include all other fields from orderDetails
          "orderDetails.amount": 1, // Include all other fields from orderDetails
          "orderDetails.subTotal": 1, // Include all other fields from orderDetails
          "orderDetails.discountAmount": 1, // Include all other fields from orderDetails
          "orderDetails.couponAmount": 1, // Include all other fields from orderDetails
          "orderDetails.status": 1, // Include all other fields from orderDetails
          "orderDetails.paymentStatus": 1, // Include all other fields from orderDetails
          "orderDetails.trackingNumber": 1, // Include all other fields from orderDetails
          "orderDetails.orderNotes": 1, // Include all other fields from orderDetails
          "orderDetails.orderDate": 1, // Include all other fields from orderDetails
          "orderDetails.invoice_no": 1, // Include all other fields from orderDetails
          shippingStatusDetails: 1, // Include shipping status details
        },
      },
    ];

    // Execute the aggregation pipeline using Mongoose
    const orderHistoryWithOrdersAndShippingStatus =
      await OrderHistory.aggregate(pipeline);

    // Respond with the results
    res
      .status(200)
      .json({ success: true, data: orderHistoryWithOrdersAndShippingStatus });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching order history.",
    });
  }
};

module.exports = {
  createOrderWithPayment,
  paymentSuccess,
  paymentFailure,
  getOrderSummaryAfterPay,
  getOrderStatus,
  // sendEmailUser,
  getUserOrderHistory,
};
