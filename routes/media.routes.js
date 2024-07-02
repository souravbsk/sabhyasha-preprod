const {
  uploadFile,
  listImagesByFolder,
  listImageFolders,
  deleteImage,
  deleteFolder,
  getAllImageWithFolder,
} = require("../controllers/mediaController");

const mediaRoute = require("express").Router();
const upload = require("multer")();

// create blog category
mediaRoute.post("/", upload.any(), uploadFile); // view all blogs
mediaRoute.get("/image-list-by-folder/:folderName", listImagesByFolder);
mediaRoute.get("/list-images-with-folders", getAllImageWithFolder);
mediaRoute.get("/list-folders", listImageFolders);
mediaRoute.delete("/image", deleteImage);
mediaRoute.delete("/delete-folder/:folderName", deleteFolder);

module.exports = { mediaRoute };
