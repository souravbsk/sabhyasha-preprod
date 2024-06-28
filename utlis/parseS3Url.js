const parseS3Url = async (url) => {
  const regex = /^https:\/\/([^/]+)\.s3\.[^/]+\.amazonaws\.com\/(.+)$/;
  const match = url.match(regex);
  if (!match || match.length < 3) {
    throw new Error("Invalid S3 URL format");
  }
  const bucketName = match[1];
  const key = decodeURIComponent(match[2]);
  return { bucketName, key };
};

module.exports = {
  parseS3Url,
};
