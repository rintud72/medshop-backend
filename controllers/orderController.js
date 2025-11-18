const Order = require('../models/order');      // Import Order model
const Medicine = require('../models/medicine'); // Import Medicine model

// ===============================================
// ✅ Create Order (API for placing a new order)
// ===============================================
exports.createOrder = async (req, res) => {
  try {
    const { medicineId, quantity, paymentMethod = 'COD', address } = req.body;
    const userId = req.user && (req.user.userId || req.user.id);

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    if (!address || !address.street || !address.city) {
      return res.status(400).json({ message: 'Address details are required' });
    }

    const medicine = await Medicine.findById(medicineId);
    if (!medicine) return res.status(404).json({ message: 'Medicine not found' });

    if (medicine.stock < quantity) return res.status(400).json({ message: 'Not enough stock' });

    // ✅ স্ট্যাটাস লজিক
    let initialOrderStatus = 'Processing';
    let initialPaymentStatus = 'Pending';

    if (paymentMethod === 'ONLINE') {
      initialOrderStatus = 'Pending'; // অনলাইন হলে পেমেন্ট না হওয়া পর্যন্ত অর্ডার পেন্ডিং থাকবে
      initialPaymentStatus = 'Pending';
    } else {
      // COD হলে পেমেন্ট পেন্ডিং কিন্তু অর্ডার প্রসেসিং শুরু হবে
      initialPaymentStatus = 'Pending'; 
      initialOrderStatus = 'Processing';
    }

    const newOrder = new Order({
      userId,
      medicineId,
      quantity,
      priceAtOrder: medicine.price,
      address,
      paymentMethod,
      orderStatus: initialOrderStatus,   // ✅
      paymentStatus: initialPaymentStatus // ✅
    });

    if (paymentMethod === 'COD') {
      medicine.stock -= quantity;
      await medicine.save();
    }

    await newOrder.save();

    res.status(201).json({
      message: 'Order placed successfully ✅',
      order: newOrder
    });

  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ message: 'Error placing order', error: error.message });
  }
};


// ==================================================
// ✅ Get My Orders (Fetch all orders of logged user)
// ==================================================
exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user && (req.user.userId || req.user.id);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const orders = await Order.find({ userId }).populate('medicineId', 'name price');
    res.json({ orders });

  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({ message: 'Error getting orders', error: error.message });
  }
};