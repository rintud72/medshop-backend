const Medicine = require("../models/medicine");


// ======================================================================
// ✅ Add Medicine (with image upload)
//    - Handles text fields + image (from multer middleware)
// ======================================================================
exports.addMedicine = async (req, res) => {
  try {
    const { name, price, description, stock } = req.body;

    // ✅ Poriborton: Shompurno URL save kora hocche
    const image = req.file ? `${process.env.BACKEND_URL}/uploads/${req.file.filename}` : null;

    // 👉 Validate required fields
    if (!name || !price || !description || !stock) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // 👉 Create a new medicine document
    const newMedicine = new Medicine({
      name,
      price,
      description,
      stock,
      image,
    });

    // 👉 Save to database
    await newMedicine.save();

    res.status(201).json({
      message: "Medicine added successfully ✅",
      medicine: newMedicine,
    });

  } catch (error) {
    console.error("Error adding medicine:", error);
    res.status(500).json({
      message: "Failed to add medicine",
      error: error.message,
    });
  }
};



// ======================================================================
// ✅ Get Medicines (With Pagination + Search)
//    - search by name (case-insensitive)
//    - pagination included (limit = 8)
// ======================================================================
exports.getMedicines = async (req, res) => {
  try {
    // 👉 Pagination setup
    const page = parseInt(req.query.page) || 1;
    const limit = 8;
    const skip = (page - 1) * limit;

    // 👉 Search functionality
    const searchQuery = req.query.search || "";
    const filter = {};

    // 👉 If search keyword exists -> search by medicine name
    if (searchQuery) {
      filter.name = { $regex: searchQuery, $options: 'i' };
      // 'i' means case-insensitive
    }

    // 👉 Count total medicines after applying search filter
    const total = await Medicine.countDocuments(filter);

    // 👉 Fetch medicines for this page
    const medicines = await Medicine.find(filter)
      .skip(skip)
      .limit(limit);

    res.json({
      medicines,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });

  } catch (error) {
    console.error("Error fetching medicines:", error);
    res.status(500).json({ message: "Server error fetching medicines" });
  }
};



// ======================================================================
// ✅ Get Single Medicine by ID
//    - Useful for product details page or admin editing
// ======================================================================
exports.getMedicineById = async (req, res) => {
  try {
    // 👉 Get medicine using ID from URL params
    const medicine = await Medicine.findById(req.params.id);

    if (!medicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    res.json(medicine);

  } catch (error) {
    console.error("Error fetching single medicine:", error);
    res.status(500).json({ message: "Failed to fetch medicine" });
  }
};



// ======================================================================
// ✅ Update Medicine (Optional image update)
//    - If new image uploaded -> update image
//    - Otherwise keep old image
// ======================================================================
exports.updateMedicine = async (req, res) => {
  try {
    const { name, price, description, stock } = req.body;

    // ✅ Poriborton: Shompurno URL save kora hocche
    const image = req.file ? `${process.env.BACKEND_URL}/uploads/${req.file.filename}` : undefined;

    // 👉 Only update provided fields
    const updateFields = { name, price, description, stock };
    if (image) updateFields.image = image;

    // 👉 Update and return the updated record
    const updatedMedicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true } // return updated document + validation enabled
    );

    if (!updatedMedicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    res.json({
      message: "Medicine updated successfully ✅",
      medicine: updatedMedicine,
    });

  } catch (error) {
    console.error("Error updating medicine:", error);
    res.status(500).json({
      message: "Failed to update medicine",
      error: error.message,
    });
  }
};



// ======================================================================
// ✅ Delete Medicine
//    - Remove one medicine by ID
// ======================================================================
exports.deleteMedicine = async (req, res) => {
  try {
    const deletedMedicine = await Medicine.findByIdAndDelete(req.params.id);

    if (!deletedMedicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    res.json({ message: "Medicine deleted successfully 🗑️" });

  } catch (error) {
    console.error("Error deleting medicine:", error);
    res.status(500).json({ message: "Failed to delete medicine" });
  }
};