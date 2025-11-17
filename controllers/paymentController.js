const Razorpay = require('razorpay');  // Import Razorpay SDK
const crypto = require('crypto');      // Used to verify payment signatures
const Order = require('../models/order');  // Order model
const Medicine = require('../models/medicine'); // Medicine model

// ============================================================
// ✅ Initialize Razorpay instance ONLY if API keys are provided
// ============================================================
let razorpay = null;

if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  // Creating a Razorpay instance using keys stored in environment variables
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  console.log('✅ Razorpay initialized successfully.');
} else {
  // If keys are missing, Razorpay features will NOT be available
  console.warn('⚠️ Razorpay keys missing. Payment features will be disabled.');
}


// ==================================================================
// ✅ Create Razorpay Order (Handles Full Cart Checkout for Online Pay)
// ==================================================================
exports.createRazorpayOrder = async (req, res) => {
  try {
    // If Razorpay was not initialized, return error
    if (!razorpay) {
      return res.status(503).json({
        success: false,
        message: 'Payment service not configured. Please try Cash on Delivery.',
      });
    }

    const userId = req.user.userId; // Logged-in user's ID

    // Get all "Pending" cart items for this user
    const cartItems = await Order.find({ userId, status: 'Pending' })
      .populate('medicineId', 'price');

    if (cartItems.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty' });
    }

    // Calculate total cart amount
    let totalAmount = 0;

    for (const item of cartItems) {
      // Ensure medicine still exists in DB
      if (!item.medicineId) {
        return res.status(404).json({
          message: `Medicine ID ${item.medicineId} not found in cart. Please remove it.`,
        });
      }

      // priceAtOrder ensures price is locked from when added to cart
      totalAmount += item.priceAtOrder * item.quantity;
    }

    // Razorpay requires amount in *paisa*, so multiply by 100
    const options = {
      amount: totalAmount * 100,
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`, // Unique receipt ID
    };

    // Create Razorpay order
    const order = await razorpay.orders.create(options);

    // Store Razorpay order ID in all pending cart items
    await Order.updateMany(
      { userId, status: 'Pending' },
      { $set: { paymentId: order.id } }
    );

    // Send Razorpay details to frontend to complete payment
    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID, // The public key for frontend
      userName: req.user.name,          // User's name for billing
      userEmail: req.user.email,        // User's email
    });

  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating Razorpay order'
    });
  }
};


// ============================================================
// ✅ Verify Razorpay Payment + Deduct Stock
// ============================================================
exports.verifyPayment = async (req, res) => {
  try {
    // Block if Razorpay is not configured
    if (!razorpay) {
      return res.status(503).json({
        success: false,
        message: 'Payment service not configured. Please try Cash on Delivery.',
      });
    }

    // Extract Razorpay payment details sent from frontend
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, address } = req.body;
    const userId = req.user.userId;

    // Create a message body for hashing (as required by Razorpay)
    const body = razorpay_order_id + '|' + razorpay_payment_id;

    // Generate expected signature using Razorpay secret
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    // Compare Razorpay signature with expected signature
    if (expectedSignature === razorpay_signature) {
      // Signature verification SUCCESS → Payment is genuine

      // Fetch all pending cart items with matching paymentId
      const paidItems = await Order.find({
        userId,
        paymentId: razorpay_order_id,
        status: 'Pending'
      });

      if (paidItems.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No pending orders found for this payment.'
        });
      }

      // For each paid item → Deduct stock & update order status
      for (const item of paidItems) {
        const medicine = await Medicine.findById(item.medicineId);

        // If medicine does not exist OR stock is not enough
        if (!medicine || medicine.stock < item.quantity) {
          item.status = 'Failed';
          await item.save();

          return res.status(400).json({
            success: false,
            message: `Stock issue for ${medicine?.name}. Order marked as Failed.`,
          });
        }

        // Deduct stock
        medicine.stock -= item.quantity;
        await medicine.save();

        // Update order status to Paid
        item.status = 'Paid';
        item.paymentMethod = 'ONLINE';
        item.address = address;
        await item.save();
      }

      // Payment verified successfully
      res.json({ success: true, message: 'Payment verified successfully ✅' });

    } else {
      // Signature mismatch → Payment is NOT genuine

      // Mark all related pending orders as Failed
      await Order.updateMany(
        { userId, paymentId: razorpay_order_id, status: 'Pending' },
        { $set: { status: 'Failed' } }
      );

      res.status(400).json({
        success: false,
        message: 'Invalid payment signature ❌'
      });
    }

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying payment',
      error: error.message
    });
  }
};
