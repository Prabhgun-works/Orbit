const cloudinary = require("cloudinary").v2;
const multer     = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use memory storage — buffer is piped directly to Cloudinary upload_stream
// This avoids multer-storage-cloudinary which only supports Cloudinary v1
const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Reusable upload helper — used in marketplace controller (Sprint 3)
const uploadToCloudinary = (buffer, folder, resourceType = "raw") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `orbit/${folder}`, resource_type: resourceType },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });
};

module.exports = { cloudinary, memoryUpload, uploadToCloudinary };
