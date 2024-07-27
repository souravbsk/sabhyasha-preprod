const sharp = require("sharp");

const processImage = async (fileBuffer) => {
  let webpBuffer;
  let quality = 90; // Initial quality
  let resizeWidth = 800; // Initial width

  while (true) {
    webpBuffer = await sharp(fileBuffer)
      .resize({ width: resizeWidth }) // Resize to the current width
      .webp({ quality }) // Set the quality
      .toBuffer();

    if (webpBuffer.length <= 800 * 1024) {
      break; // Exit the loop if the buffer size is below 800 KB
    }

    if (quality > 10) {
      quality -= 10; // Reduce quality by 10%
    } else if (resizeWidth > 200) {
      resizeWidth -= 100; // Reduce width by 100px
    } else {
      throw new Error(
        "Image size exceeds 800 KB after processing, unable to compress further"
      );
    }
  }
  return webpBuffer;
};

module.exports = { processImage };
