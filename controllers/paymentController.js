const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/order');
const Medicine = require('../models/medicine');

let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  console.log('✅ Razorpay initialized successfully.');
} else {
  console.warn('⚠️ Razorpay keys missing. Payment features will be disabled.');
}

// ... (createRazorpayOrder ফাংশনটি অপরিবর্তিত থাকবে, আগের মতোই)
exports.createRazorpayOrder = async (req, res) => {
  // ... আপনার আগের কোড (শুধু ensure করুন পেমেন্ট ID সেভ হচ্ছে)
   try {
    if (!razorpay) return res.status(503).json({ success: false, message: 'Service unavailable' });

    const userId = req.user.userId;
    const cartItems = await Order.find({ userId, orderStatus: 'Pending', paymentMethod: 'ONLINE' }).populate('medicineId', 'price'); // কুয়েরি আপডেট

    // যদি আগের লজিক থাকে যেখানে status: 'Pending' ছিল, সেটা এখন orderStatus: 'Pending' হবে
    // অথবা আপনি চাইলে createRazorpayOrder এর লজিক আগের মতোই রাখতে পারেন, শুধু find কুয়েরি ঠিক করবেন।
    
    // (সহজ করার জন্য আমি ধরে নিচ্ছি আপনার আগের createRazorpayOrder ঠিক আছে, শুধু verifyPayment-এ পরিবর্তন দরকার)
    // তবুও সম্পূর্ণ ফাংশন নিচে দিলাম:

    const pendingItems = await Order.find({ userId, orderStatus: 'Pending' }).populate('medicineId', 'price');

    if (pendingItems.length === 0) return res.status(400).json({ message: 'Cart empty' });

    let totalAmount = 0;
    for (const item of pendingItems) {
      if (!item.medicineId) return res.status(404).json({ message: 'Medicine not found' });
      totalAmount += item.priceAtOrder * item.quantity;
    }

    const options = {
      amount: totalAmount * 100,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    await Order.updateMany(
      { userId, orderStatus: 'Pending' },
      { $set: { paymentId: order.id } }
    );

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      userName: req.user.name,
      userEmail: req.user.email,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Error creating order' });
  }
};


// ============================================================
// ✅ Verify Razorpay Payment + Deduct Stock (UPDATED)
// ============================================================
exports.verifyPayment = async (req, res) => {
  try {
    if (!razorpay) return res.status(503).json({ success: false, message: 'Service unavailable' });

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, address } = req.body;
    const userId = req.user.userId;

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      // ✅ পেমেন্ট সফল
      const paidItems = await Order.find({
        userId,
        paymentId: razorpay_order_id,
        orderStatus: 'Pending' // অর্ডার পেন্ডিং অবস্থায় আছে
      });

      if (paidItems.length === 0) {
        return res.status(400).json({ success: false, message: 'No orders found.' });
      }

      for (const item of paidItems) {
        const medicine = await Medicine.findById(item.medicineId);

        if (!medicine || medicine.stock < item.quantity) {
          item.orderStatus = 'Cancelled';
          item.paymentStatus = 'Failed'; // রিফান্ড পলিসি থাকলে এখানে হ্যান্ডেল করতে হয়
          await item.save();
          return res.status(400).json({ success: false, message: `Stock issue for ${medicine?.name}.` });
        }

        // স্টক কমানো
        medicine.stock -= item.quantity;
        await medicine.save();

        // ✅ স্ট্যাটাস আপডেট: পেমেন্ট -> Paid, অর্ডার -> Processing
        item.paymentStatus = 'Paid';
        item.orderStatus = 'Processing';
        item.paymentMethod = 'ONLINE';
        item.address = address;
        await item.save();
      }

      res.json({ success: true, message: 'Payment verified successfully ✅' });

    } else {
      // ❌ পেমেন্ট ব্যর্থ
      await Order.updateMany(
        { userId, paymentId: razorpay_order_id, orderStatus: 'Pending' },
        { $set: { paymentStatus: 'Failed', orderStatus: 'Cancelled' } }
      );

      res.status(400).json({ success: false, message: 'Invalid signature ❌' });
    }

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, message: 'Error verifying payment', error: error.message });
  }
};