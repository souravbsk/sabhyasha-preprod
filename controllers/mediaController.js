const {
  uploadToS3,
  listS3Objects,
  listS3Folders,
  deleteS3Object,
  deleteS3Folder,
  listS3ObjectsWithFolders,
} = require("../utlis/awsTools");
const { parseS3Url } = require("../utlis/parseS3Url");

const uploadFile = async (req, res) => {
  try {
    const { folderName } = req?.body;
    console.log(folderName);
    const imageURLs = await uploadToS3(folderName)(req, res, async () => {
      try {
        console.log(req.fileUrls);

        const uploadUrl = {
          imageURLs: req.fileUrls[0],
        };
        console.log(uploadUrl);

        return res.status(201).json({
          success: true,
          message: "Media Link created successfully",
          data: uploadUrl,
        });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
      }
    });

    // Handle any errors from the middleware
    if (imageURLs instanceof Error) {
      throw imageURLs;
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const listImagesByFolder = async (req, res) => {
  try {
    const folderName = req.params.folderName;
    console.log(folderName)
    await listS3Objects(folderName)(req, res);
  } catch (error) {
    console.error("Error listing images:", error);
    res.status(500).json({ message: "Failed to list images" });
  }
};

const listImageFolders = async (req, res) => {
  try {
    await listS3Folders(process.env.S3_BUCKET_NAME)(req, res); // Use the correct prefix for your bucket
  } catch (error) {
    console.error("Error listing image folders:", error);
    res.status(500).json({ message: "Failed to list image folders" });
  }
};

const deleteImage = async (req, res) => {
  console.log(req);
  const bucketName = process.env.S3_BUCKET_NAME;
  console.log(req.body.imageData)
  const key = req.body.url; // Assuming the key is passed in the URL parameter

  console.log(key)
  try {
    const newParseS3Url = await parseS3Url(key);

    await deleteS3Object(newParseS3Url);
    res.status(200).json({ message: `Deleted ${key} from S3` });
  } catch (error) {
    console.error("Delete image from S3 error:", error);
    res.status(500).json({ error: "Failed to delete image from S3" });
  }
};

const deleteFolder = async (req, res) => {
  const { folderName } = req.params;
  try {
    await deleteS3Folder(folderName);
    res
      .status(200)
      .json({ message: `Folder ${folderName} deleted successfully` });
  } catch (error) {
    console.error("Error deleting folder:", error);
    res.status(500).json({ message: "Failed to delete folder" });
  }
};

const getAllImageWithFolder = async (req, res) => {
  try {
    const imageLinksByFolder = await listS3ObjectsWithFolders();
    res.status(200).json(imageLinksByFolder);
  } catch (error) {
    console.error("Error listing images with folders:", error);
    res.status(500).json({ message: "Failed to list images with folders" });
  }
};
module.exports = {
  uploadFile,
  listImagesByFolder,
  listImageFolders,
  deleteImage,
  deleteFolder,
  getAllImageWithFolder,
};
