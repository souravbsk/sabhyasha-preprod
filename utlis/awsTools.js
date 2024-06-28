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

const listS3Folders = (bucketName, prefix) => {
  return async (req, res) => {
    const params = {
      Bucket: bucketName,
      Prefix: prefix,
      Delimiter: "/",
    };

    try {
      const data = await s3.listObjectsV2(params).promise();
      const folders = data.CommonPrefixes.map((item) => item.Prefix);
      res.status(200).json({ folders });
    } catch (err) {
      console.error("S3 List Folders Error", err);
      res.status(500).json({ message: "Failed to list folders in S3" });
    }
  };
};

const listS3Objects = (folderName) => {
  return async (req, res) => {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Prefix: `${folderName}/`,
    };

    try {
      const data = await s3.listObjectsV2(params).promise();
      const fileUrls = data.Contents.map((item) => {
        // Constructing the URL based on your specified format
        return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com/${item.Key}`;
      });

      console.log(fileUrls);
      res.status(200).json({ folderName, fileUrls });
    } catch (err) {
      console.error("S3 List Objects Error", err);
      res.status(500).json({ message: "Failed to list files in S3" });
    }
  };
};

const listS3ObjectsWithFolders = async () => {
  const bucketName = process.env.S3_BUCKET_NAME;
  const params = {
    Bucket: bucketName,
  };

  try {
    const data = await s3.listObjectsV2(params).promise();
    const folderMap = {};

    // Group file URLs by folder name
    data.Contents.forEach((item) => {
      const folder = item.Key.split("/")[0]; // Extract folder name
      if (!folderMap[folder]) {
        folderMap[folder] = [];
      }
      folderMap[folder].push(
        `https://${bucketName}.s3.${process.env.S3_REGION}.amazonaws.com/${item.Key}`
      );
    });

    // Prepare response structure
    const response = Object.keys(folderMap).map((folderName) => ({
      folderName,
      fileUrls: folderMap[folderName],
    }));

    return response;
  } catch (err) {
    console.error("S3 List Objects Error", err);
    throw err; // Propagate the error to the caller
  }
};

const deleteS3Object = async (newParseS3Url) => {
  try {
    // Extract bucket name and key from the URL
    const { bucketName, key } = newParseS3Url;

    // Construct params for deleteObject operation
    const params = {
      Bucket: bucketName,
      Key: key,
    };

    // Delete object from S3 bucket
    await s3.deleteObject(params).promise();
    console.log(`Deleted ${key} from ${bucketName}`);
  } catch (error) {
    console.error("Delete object from S3 error:", error);
    throw error;
  }
};

// folder delete

const deleteS3Folder = async (folderName) => {
  const bucketName = process.env.S3_BUCKET_NAME;
  const params = {
    Bucket: bucketName,
    Prefix: `${folderName}/`,
  };

  try {
    const data = await s3.listObjectsV2(params).promise();

    if (data.Contents.length === 0) {
      // Folder is already empty, just delete the prefix itself (folder)
      await s3
        .deleteObject({ Bucket: bucketName, Key: `${folderName}/` })
        .promise();
      console.log(`Deleted folder ${folderName} from ${bucketName}`);
      return;
    }

    // Prepare list of objects to delete
    const deleteParams = {
      Bucket: bucketName,
      Delete: { Objects: [] },
    };

    data.Contents.forEach(({ Key }) => {
      deleteParams.Delete.Objects.push({ Key });
    });

    // Delete objects in batches of 1000 (maximum allowed per operation)
    await s3.deleteObjects(deleteParams).promise();

    // If there are more objects to delete, recursively call deleteS3Folder
    if (data.IsTruncated) {
      await deleteS3Folder(folderName);
    } else {
      // Finally, delete the prefix itself (folder)
      await s3
        .deleteObject({ Bucket: bucketName, Key: `${folderName}/` })
        .promise();
      console.log(`Deleted folder ${folderName} from ${bucketName}`);
    }
  } catch (error) {
    console.error(
      `Error deleting folder ${folderName} from ${bucketName}:`,
      error
    );
    throw error;
  }
};

module.exports = {
  uploadToS3,
  listS3Folders,
  listS3Objects,
  deleteS3Object,
  deleteS3Folder,
  listS3ObjectsWithFolders,
};
