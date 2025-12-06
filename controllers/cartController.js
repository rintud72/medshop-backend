// medicine-shop/controllers/cartController.js

const mongoose = require('mongoose'); 
const User = require('../models/user');
const Medicine = require('../models/medicine');
const Order = require('../models/order');
const { createClient } = require("@supabase/supabase-js");

// ✅ Supabase ইনিশিলাইজেশন
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ======================================================================
// ✅ GET /api/cart
// ======================================================================
exports.getCartItems = async (req, res) => {
  try {
    const userId = req.user.userId; 
    const cartItems = await Order.find({ userId, status: 'Pending' })
      .populate('medicineId', 'name price image stock');

    res.json({ cart: { items: cartItems } });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ message: 'Error fetching cart items' });
  }
};

// ======================================================================
// ✅ POST /api/cart/add
// ======================================================================
exports.addToCart = async (req, res) => {
  try {
    const { medicineId, quantity } = req.body;
    const userId = req.user.userId;

    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    let existingCartItem = await Order.findOne({
      userId,
      medicineId,
      status: 'Pending',
    });

    if (existingCartItem) {
      const newQuantity = existingCartItem.quantity + quantity;
      if (medicine.stock < newQuantity) {
        return res.status(400).json({
          message: `Not enough stock. Only ${medicine.stock} left.`,
        });
      }
      existingCartItem.quantity = newQuantity;
      await existingCartItem.save();
      res.json({ message: 'Item quantity updated in cart', order: existingCartItem });

    } else {
      if (medicine.stock < quantity) {
        return res.status(400).json({
          message: `Not enough stock. Only ${medicine.stock} left.`,
        });
      }
      const newCartItem = new Order({
        userId,
        medicineId,
        quantity,
        priceAtOrder: medicine.price,
        status: 'Pending',
      });
      await newCartItem.save();
      res.status(201).json({ message: 'Item added to cart', order: newCartItem });
    }

  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ message: 'Error adding to cart' });
  }
};

// ======================================================================
// ✅ DELETE /api/cart/remove/:id
// ======================================================================
exports.removeFromCart = async (req, res) => {
  try {
    const medicineId = req.params.id; 
    const userId = req.user.userId;

    const result = await Order.deleteOne({
      userId,
      medicineId,
      status: 'Pending',
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    res.json({ message: 'Item removed from cart' });

  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ message: 'Error removing from cart' });
  }
};

// ======================================================================
// ✅ POST /api/cart/checkout (Updated with Prescription Upload)
// ======================================================================
exports.checkout = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    // ✅ Address পার্সিং (FormData থেকে স্ট্রিং হিসেবে আসে)
    let { address } = req.body;
    
    // যদি address স্ট্রিং আকারে আসে তবে পার্স করুন
    if (typeof address === 'string') {
      try {
        address = JSON.parse(address);
      } catch (e) {
        return res.status(400).json({ message: 'Invalid address format' });
      }
    }

    if (!address || !address.street || !address.city || !address.postalCode || !address.phone) {
      return res.status(400).json({
        message: 'Shipping address is incomplete. Please provide street, city, postalCode, and phone.',
      });
    }

    const userId = req.user.userId;
    let prescriptionUrl = null;

    // ✅ Prescription ইমেজ আপলোড লজিক
    if (req.file) {
      const file = req.file;
      const fileName = `rx_${Date.now()}_${file.originalname}`;

      // 'medicines' বাকেটে আপলোড করা হচ্ছে (আগে থেকে তৈরি থাকা বাকেট ব্যবহার করুন)
      const { data, error } = await supabase.storage
        .from("medicines") 
        .upload(fileName, file.buffer, { contentType: file.mimetype });

      if (error) {
        console.error("Supabase Upload Error:", error);
        throw new Error("Prescription upload failed");
      }

      const { data: publicUrl } = supabase.storage
        .from("medicines")
        .getPublicUrl(fileName);

      prescriptionUrl = publicUrl.publicUrl;
    }

    const paymentMethod = 'COD'; // Cash On Delivery

    await session.withTransaction(async () => {
      const cartItems = await Order.find({ userId, status: 'Pending' }).session(session);

      if (cartItems.length === 0) {
        throw new Error('Your cart is empty!');
      }

      for (const item of cartItems) {
        const medicine = await Medicine.findById(item.medicineId).session(session);

        if (!medicine) {
          throw new Error(`Medicine ID ${item.medicineId} not found.`);
        }

        if (medicine.stock < item.quantity) {
          throw new Error(`Not enough stock for ${medicine.name}. Only ${medicine.stock} left.`);
        }

        medicine.stock -= item.quantity;
        await medicine.save({ session });

        item.status = paymentMethod;
        item.address = address;
        
        // ✅ অর্ডারে প্রেসক্রিপশন লিংক সেভ করা হলো
        if (prescriptionUrl) {
          item.prescription = prescriptionUrl;
        }
        
        await item.save({ session });
      }
    });

    await session.endSession();
    res.json({ message: 'Checkout successful! Order placed.' });

  } catch (error) {
    await session.endSession();
    console.error('Error during checkout transaction:', error);
    res.status(500).json({ message: error.message || 'Error during checkout' });
  }
};