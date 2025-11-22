const User = require("../models/user");
const Order = require("../models/order");
const Medicine = require("../models/medicine");

// =====================================================
// 👥 Get all users
// =====================================================
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
// ✏️ Update user (Admin)
// =====================================================
exports.updateUser = async (req, res) => {
  try {
    const { name, email, role, isVerified } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, role, isVerified },
      { new: true, runValidators: true }
    ).select("-password -phoneOtp -otpExpiresAt");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Error updating user", error: error.message });
  }
};

// =====================================================
// ❌ Delete user by ID
// =====================================================
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
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "name email")
      .populate("medicineId", "name price");

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
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
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
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "USER" });
    const totalOrders = await Order.countDocuments({
      status: { $in: ["Paid", "COD"] },
    });

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
    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    const lowStockMedicines = await Medicine.find({ stock: { $lt: 10 } })
      .select("name stock")
      .limit(5);

    const totalMedicines = await Medicine.countDocuments();

    const stockData = await Medicine.aggregate([
      {
        $group: {
          _id: null,
          totalStock: { $sum: "$stock" },
        },
      },
    ]);
    const totalStock = stockData.length > 0 ? stockData[0].totalStock : 0;

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