const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema(
  {
    // Name of the medicine (required)
    name: { type: String, required: true },

    // Optional description
    description: { type: String },

    // Price of the medicine (required)
    price: { type: Number, required: true },

    // Available stock quantity (default = 0)
    stock: { type: Number, default: 0 },

    // Category name (e.g., Tablets, Syrup, Injection)
    category: { type: String },

    // Image URL or uploaded file name
    image: { type: String },
  },
  {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true,
  }
);

module.exports = mongoose.model("Medicine", medicineSchema);
