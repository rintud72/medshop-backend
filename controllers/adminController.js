const User = require("../models/user");
const Order = require("../models/order");
const Medicine = require("../models/medicine");

// =====================================================
// 👥 Get all users
// =====================================================
/*
  This function fetches all users from the database.
  Sensitive fields like password, OTP, and OTP expiry are removed before sending.
*/
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password -phoneOtp -otpExpiresAt");

    res.json({
      total: users.length,
      users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      message: "Error fetching users",
      error: error.message,
    });
  }
};

// =====================================================
// ❌ Delete user by ID
// =====================================================
/*
  Deletes a user by their ID.
  If user doesn't exist → return 404.
*/
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user)
      return res.status(404).json({ message: "User not found" });

    res.json({ message: "User deleted successfully 🗑️" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting user",
      error: error.message,
    });
  }
};

// =====================================================
// 📦 Get all orders
// =====================================================
/*
  Fetches all orders.
  Populates user & medicine info for better readability.
*/
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "name email")      // add user info
      .populate("medicineId", "name price"); // add medicine info

    res.json({
      total: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      message: "Error fetching orders",
      error: error.message,
    });
  }
};

// =====================================================
// 🔁 Update order status
// =====================================================
/*
  Updates the status of an order (e.g., Pending → Delivered).
  The updated order is returned with user details.
*/
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true } // return updated document
    ).populate("userId", "name email");

    if (!order)
      return res.status(404).json({ message: "Order not found" });

    res.json({
      message: "Order status updated ✅",
      order,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating order",
      error: error.message,
    });
  }
};

// =====================================================
// 📊 Dashboard Stats (Admin)
// =====================================================
/*
  Provides admin dashboard analytics:
  1. Total users (excluding admin)
  2. Total orders (Paid + COD)
  3. Total revenue (quantity × priceAtOrder)
  4. Low-stock medicines
  5. Total medicine types
  6. Total stock (sum of all medicine stock)
*/
exports.getDashboardStats = async (req, res) => {
  try {
    // 1. Total number of users (excluding admin)
    const totalUsers = await User.countDocuments({ role: "USER" });

    // 2. Total number of completed orders
    const totalOrders = await Order.countDocuments({
      status: { $in: ["Paid", "COD"] },
    });

    // 3. Total revenue using MongoDB aggregation
    const revenueData = await Order.aggregate([
      {
        $match: {
          status: { $in: ["Paid", "COD"] },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: { $multiply: ["$priceAtOrder", "$quantity"] },
          },
        },
      },
    ]);
    const totalRevenue =
      revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    // 4. Medicines with low stock (<10)
    const lowStockMedicines = await Medicine.find({ stock: { $lt: 10 } })
      .select("name stock")
      .limit(5);

    // 5. Count total types of medicines
    const totalMedicines = await Medicine.countDocuments();

    // 6. Calculate total available stock using aggregation
    const stockData = await Medicine.aggregate([
      {
        $group: {
          _id: null,
          totalStock: { $sum: "$stock" },
        },
      },
    ]);
    const totalStock =
      stockData.length > 0 ? stockData[0].totalStock : 0;

    // Send all dashboard stats together
    res.json({
      totalUsers,
      totalOrders,
      totalRevenue,
      lowStockMedicines,
      totalMedicines,
      totalStock,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      message: "Error fetching dashboard stats",
      error: error.message,
    });
  }
};
