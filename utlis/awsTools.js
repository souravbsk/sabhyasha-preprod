const AWS = require("aws-sdk");
require("dotenv").config();

AWS.config.update({
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_KEY,
  region: process.env.S3_REGION,
});

const s3 = new AWS.S3();

const uploadToS3 = (folderName) => {
  return async (req, res, next) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    console.log(req.files);
    const fileUploadPromises = req.files.map((file) => {
      const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `${folderName}/${Date.now()}_${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      return s3.upload(params).promise();
    });

    try {
      const results = await Promise.all(fileUploadPromises);
      req.fileUrls = results.map((result) => result.Location);
      if (next) {
        next();
      }
    } catch (err) {
      console.error("S3 Upload Error", err);
      return res.status(500).json({ message: "Failed to upload files to S3" });
    }
  };
};

module.exports = { uploadToS3 };
