const cloudinary = require("cloudinary").v2;
const encBase64 = require("crypto-js/enc-base64");

const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

const uploadToCloudInary = async (
  picture_directory /*Picture where to store picture on cloudinary*/,
  photo /*Picture data or file */,
  fileName /* name of the file ON CLOUDINARY*/
) => {
  const convertedPicture = convertToBase64(photo);

  const uploadResult = await cloudinary.uploader.upload(convertedPicture, {
    folder: `/vinted/` + picture_directory + `/${fileName}`,
  });
  return uploadResult;
};

module.exports.uploadToCloudInary = uploadToCloudInary;
module.exports.convertToBase64 = convertToBase64;
