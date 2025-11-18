const Order = require('../models/order');      // Import Order model
const Medicine = require('../models/medicine'); // Import Medicine model

// ===============================================
// ✅ Create Order (API for placing a new order)
// ===============================================
exports.createOrder = async (req, res) => {
  try {
    // Extracting values from request body
    const { medicineId, quantity, paymentMethod = 'COD', address } = req.body;

    // Getting the logged-in user's ID from JWT payload
    const userId = req.user && (req.user.userId || req.user.id);

    // If user is not logged in → Unauthorized
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    // Validating address fields (street and city are required)
    if (!address || !address.street || !address.city) {
      return res.status(400).json({ message: 'Address details are required' });
    }

    // Fetching the selected medicine from database
    const medicine = await Medicine.findById(medicineId);

    // If medicine doesn't exist → Not Found
    if (!medicine) return res.status(404).json({ message: 'Medicine not found' });

    // Checking if requested quantity is available in stock
    if (medicine.stock < quantity) return res.status(400).json({ message: 'Not enough stock' });

    // Creating a new order object (not saved yet)
    const newOrder = new Order({
      userId,                     // ID of the user who placed the order
      medicineId,                 // Which medicine is ordered
      quantity,                   // How many units
      priceAtOrder: medicine.price, // Price saved at the time of order (prevents future price change issues)
      address,                    // Delivery address
      paymentMethod,              // Payment method (COD/online)
      status: paymentMethod === 'COD' ? 'COD' : 'Pending' // COD = confirmed, others = pending
    });

    // If payment method is COD, reduce the stock immediately
    if (paymentMethod === 'COD') {
      medicine.stock -= quantity; // Reduce stock
      await medicine.save();      // Save updated stock
    }

    // Save the order in the database
    await newOrder.save();

    // Send success response
    res.status(201).json({
      message: 'Order placed successfully ✅',
      order: newOrder
    });

  } catch (error) {
    console.error('Error placing order:', error);
    // Send server error response
    res.status(500).json({ message: 'Error placing order', error: error.message });
  }
};


// ==================================================
// ✅ Get My Orders (Fetch all orders of logged user)
// ==================================================
exports.getMyOrders = async (req, res) => {
  try {
    // Get user ID from JWT token
    const userId = req.user && (req.user.userId || req.user.id);

    // Check if user is authenticated
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    // Fetch all orders of this user
    // populate() helps to fetch medicine name & price instead of just ID
    const orders = await Order.find({ userId }).populate('medicineId', 'name price');

    // Return all user orders
    res.json({ orders });

  } catch (error) {
    console.error('Error getting orders:', error);
    // Error response
    res.status(500).json({ message: 'Error getting orders', error: error.message });
  }
};
