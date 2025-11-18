const User = require("../models/user");
const Order = require("../models/order");
const Medicine = require("../models/medicine");

// ... getAllUsers এবং deleteUser আগের মতোই থাকবে ...
exports.getAllUsers = async (req, res) => { /* ... আগের কোড ... */ };
exports.deleteUser = async (req, res) => { /* ... আগের কোড ... */ };

// =====================================================
// 📦 Get all orders
// =====================================================
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "name email")
      .populate("medicineId", "name price");

    res.json({ total: orders.length, orders });
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders", error: error.message });
  }
};

// =====================================================
// 🔁 Update order status
// =====================================================
exports.updateOrderStatus = async (req, res) => {
  try {
    // এখন আমরা মূলত 'orderStatus' আপডেট করব
    const { status } = req.body; 

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus: status }, // ✅ ফিল্ড নাম আপডেট
      { new: true }
    ).populate("userId", "name email");

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json({ message: "Order status updated ✅", order });
  } catch (error) {
    res.status(500).json({ message: "Error updating order", error: error.message });
  }
};

// =====================================================
// 📊 Dashboard Stats (Admin)
// =====================================================
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: "USER" });

    // ✅ Valid Orders: হয় পেমেন্ট Paid, অথবা COD এবং Cancelled নয়
    const validOrderQuery = {
      $or: [
        { paymentStatus: 'Paid' },
        { paymentMethod: 'COD', orderStatus: { $ne: 'Cancelled' } }
      ]
    };

    const totalOrders = await Order.countDocuments(validOrderQuery);

    const revenueData = await Order.aggregate([
      { $match: validOrderQuery },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $multiply: ["$priceAtOrder", "$quantity"] } },
        },
      },
    ]);
    const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    const lowStockMedicines = await Medicine.find({ stock: { $lt: 10 } }).select("name stock").limit(5);
    const totalMedicines = await Medicine.countDocuments();
    
    const stockData = await Medicine.aggregate([
      { $group: { _id: null, totalStock: { $sum: "$stock" } } },
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
    console.error("Error stats:", error);
    res.status(500).json({ message: "Error stats", error: error.message });
  }
};