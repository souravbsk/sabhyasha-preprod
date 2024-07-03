const nodemailer = require("nodemailer");

require("dotenv").config({
  path: "../.env",
});

async function generateOtp(mailId) {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.MAIL_ID,
      pass: process.env.MAIL_PASS,
    },
  });
  const otp = Math.floor(100000 + Math.random() * 900000);
  try {
    const info = await transporter.sendMail({
      from: "Sabhyasha",
      to: `${mailId}`,
      subject: "Your otp for Sabhyasha!",
      text: "Enter the otp and proceed further!",
      html: `<div style="background-color: #f8f9fa; padding: 20px; font-family: Arial, sans-serif; border-radius: 10px;"><h1 style="color: #343a40;">Your OTP is ${otp}</h1><h3>©️ Sabhyasha Retail Tech</h3></div>`,
    });
    return otp;
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

async function sendMail(mail, subject, body) {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.MAIL_ID,
      pass: process.env.MAIL_PASS,
    },
  });
  try {
    await transporter.sendMail({
      from: "Sabhyasha",
      to: `${mail}`,
      subject: `${subject}`,
      text: "You received a mail!",
      html: `<div>${body}</div>`,
    });
    return "sent";
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

module.exports = {
  generateOtp,
  sendMail,
};
