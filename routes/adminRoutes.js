const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/authenticateToken");
const adminAuth = require("../middleware/adminAuth");

const {
  getAllUsers,
  deleteUser,
  getAllOrders,
  updateOrderStatus,
  getDashboardStats // ✅ 1. Imported the new dashboard function
} = require("../controllers/adminController");

// -------------------------------------------------------------
// 👑 Admin Protected Routes
// All routes here require:
// 1. Valid JWT token
// 2. User must have ADMIN role
// -------------------------------------------------------------

// ✅ 2. Dashboard stats route added
router.get("/dashboard", authenticateToken, adminAuth, getDashboardStats);

// ---------------------- User Management ----------------------
router.get("/users", authenticateToken, adminAuth, getAllUsers);
router.delete("/users/:id", authenticateToken, adminAuth, deleteUser);

// ---------------------- Order Management ---------------------
router.get("/orders", authenticateToken, adminAuth, getAllOrders);
router.put("/orders/:id", authenticateToken, adminAuth, updateOrderStatus);

module.exports = router;
