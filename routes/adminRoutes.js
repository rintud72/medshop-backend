const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/authenticateToken");
const adminAuth = require("../middleware/adminAuth");

const {
  getAllUsers,
  deleteUser,
  updateUser, // ✅ Imported updateUser
  getAllOrders,
  updateOrderStatus,
  getDashboardStats
} = require("../controllers/adminController");

// -------------------------------------------------------------
// 👑 Admin Protected Routes
// -------------------------------------------------------------

router.get("/dashboard", authenticateToken, adminAuth, getDashboardStats);

// ---------------------- User Management ----------------------
router.get("/users", authenticateToken, adminAuth, getAllUsers);
router.put("/users/:id", authenticateToken, adminAuth, updateUser); // ✅ Added Update Route
router.delete("/users/:id", authenticateToken, adminAuth, deleteUser);

// ---------------------- Order Management ---------------------
router.get("/orders", authenticateToken, adminAuth, getAllOrders);
router.put("/orders/:id", authenticateToken, adminAuth, updateOrderStatus);

module.exports = router;