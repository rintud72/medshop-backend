const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  // ID of the user who placed the order
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // ID of the ordered medicine
  medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },

  // Quantity of the ordered item
  quantity: { type: Number, required: true },

  // Price of the medicine at the time of order
  priceAtOrder: { type: Number, required: true },

  // Payment method selected by the user
  paymentMethod: { type: String, enum: ['COD', 'ONLINE'], default: 'COD' },

  // ✅ 1. আলাদা অর্ডার স্ট্যাটাস (ডেলিভারি সংক্রান্ত)
  orderStatus: { 
    type: String, 
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'], 
    default: 'Processing' 
  },

  // ✅ 2. আলাদা পেমেন্ট স্ট্যাটাস (টাকা সংক্রান্ত)
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed'],
    default: 'Pending'
  },

  // Payment ID (from online payment gateway)
  paymentId: { type: String },

  // Delivery address details
  address: {
    street: { type: String },
    city: { type: String },
    postalCode: { type: String },
    phone: { type: String },
  },

  // Timestamp when the order was created
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);