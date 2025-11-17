const express = require("express");
const router = express.Router();

const upload = require("../middleware/uploadImage"); 
// Multer image upload middleware

const {
  addMedicine,
  getMedicines,
  getMedicineById,
  updateMedicine,
  deleteMedicine
} = require("../controllers/medicineController");


// 📦 Medicine Routes (CRUD)

// ➕ Add new medicine (supports image upload)
router.post("/", upload.single("image"), addMedicine);

// 📄 Get list of all medicines
router.get("/", getMedicines);

// 🔍 Get a single medicine by ID
router.get("/:id", getMedicineById);

// ✏️ Update medicine (image upload supported)
router.put("/:id", upload.single("image"), updateMedicine);

// 🗑️ Delete a medicine
router.delete("/:id", deleteMedicine);

module.exports = router;
