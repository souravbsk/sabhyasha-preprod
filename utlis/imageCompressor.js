const sharp = require("sharp");
const processImage = async (fileBuffer) => {
  const webpBuffer = await sharp(fileBuffer)
    .resize({ width: 800 }) // Resize to width of 800px, adjust as needed
    .webp({ quality: 80 }) // Adjust the quality to ensure size is below 800 KB
    .toBuffer();

  // Check if the buffer size is below 800 KB
  if (webpBuffer.length > 800 * 1024) {
    throw new Error("Image size exceeds 800 KB after processing");
  }

  return webpBuffer;
};

module.exports = { processImage };
