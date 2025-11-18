const multer = require("multer");
const path = require("path");

// 📌 Storage: Save file in memory buffer, not local folder
const storage = multer.memoryStorage();

// 📌 Allow only image files
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only images (jpg, jpeg, png, webp) are allowed!"), false);
  }
};

// 📌 Initialize multer (now using memory storage)
const upload = multer({ storage, fileFilter });

module.exports = upload;
