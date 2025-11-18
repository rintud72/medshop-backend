const Medicine = require("../models/medicine");
const { createClient } = require("@supabase/supabase-js");

// 🔹 Supabase client init (এই ফাইলেও লাগবে)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ======================================================================
// ✅ Add Medicine (with image upload)
//    - Handles text fields + image (from multer middleware)
// ======================================================================
exports.addMedicine = async (req, res) => {
  try {
    // ✅ category যোগ করা হলো
    const { name, price, description, stock, category } = req.body;

    let image = null;

    // 🔹 If image uploaded → upload to Supabase
    if (req.file) {
      const file = req.file;
      const fileName = Date.now() + "-" + file.originalname;

      // Upload to Supabase bucket
      const { data, error } = await supabase.storage
        .from("medicines")
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
        });

      if (error) {
        console.log("Upload error:", error);
        return res.status(500).json({ message: "Image upload failed" });
      }

      // Public URL
      const { data: publicUrl } = supabase.storage
        .from("medicines")
        .getPublicUrl(fileName);

      image = publicUrl.publicUrl;
    }

    if (!name || !price || !description || !stock) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newMedicine = new Medicine({
      name,
      price,
      description,
      stock,
      category, // ✅ ডাটাবেসে সেভ করার সময় category যোগ করা হলো
      image
    });

    await newMedicine.save();

    res.status(201).json({
      message: "Medicine added successfully",
      medicine: newMedicine,
    });

  } catch (error) {
    console.error("Error adding medicine:", error);
    res.status(500).json({ message: "Failed to add medicine" });
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
    // ✅ category যোগ করা হলো
    const { name, price, description, stock, category } = req.body;

    // ✅ আপডেট ফিল্ডসে category যোগ করা হলো
    let updateFields = { name, price, description, stock, category };

    // 🔹 If new image uploaded → upload to Supabase
    if (req.file) {
      const file = req.file;
      const fileName = Date.now() + "-" + file.originalname;

      const { data, error } = await supabase.storage
        .from("medicines")
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
        });

      if (error) {
        console.log("Upload error:", error);
        return res.status(500).json({ message: "Image upload failed" });
      }

      const { data: publicUrl } = supabase.storage
        .from("medicines")
        .getPublicUrl(fileName);

      updateFields.image = publicUrl.publicUrl;
    }

    const updatedMedicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    );

    if (!updatedMedicine) {
      return res.status(404).json({ message: "Medicine not found" });
    }

    res.json({
      message: "Medicine updated successfully",
      medicine: updatedMedicine,
    });

  } catch (error) {
    console.error("Error updating medicine:", error);
    res.status(500).json({ message: "Failed to update medicine" });
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