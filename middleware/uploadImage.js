const multer = require("multer");
const path = require("path");

// Configure storage settings for uploaded files
const storage = multer.diskStorage({
  // Folder where uploaded files will be saved
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },

  // Generate unique file name: timestamp + original file extension
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

// Allow only image files
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const ext = path.extname(file.originalname).toLowerCase();

  // Check if file extension matches allowed image types
  if (allowedTypes.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only images (jpg, jpeg, png, webp) are allowed!"), false);
  }
};

// Initialize multer with storage + filter
const upload = multer({ storage, fileFilter });

module.exports = upload;
