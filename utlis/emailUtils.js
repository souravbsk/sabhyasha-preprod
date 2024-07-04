const transporter = require("../config/nodemailerConfig.js");

// utils/emailUtils.js
require("dotenv").config();

const sendMail = async (to, subject, body) => {
  try {
    await transporter.sendMail({
      from: `"Sabhyasha" <no-reply@sabhyasha.com>`,
      to,
      subject,
      text: body.text,
      html: body.html,
    });
    return "Mail sent successfully";
  } catch (error) {
    console.error("Error sending mail:", error);
    throw new Error("Error sending mail");
  }
};

const generateOtp = async (to) => {
  const otp = Math.floor(100000 + Math.random() * 900000);
  const subject = "Your OTP for Sabhyasha!";
  const body = {
    text: "Enter the OTP and proceed further!",
    html: `<div style="background-color: #f8f9fa; padding: 20px; font-family: Arial, sans-serif; border-radius: 10px;"><h1 style="color: #343a40;">Your OTP is ${otp}</h1><h3>©️ Sabhyasha Retail Tech</h3></div>`,
  };
  await sendMail(to, subject, body);
  return otp;
};

module.exports = {
  generateOtp,
  sendMail,
};
