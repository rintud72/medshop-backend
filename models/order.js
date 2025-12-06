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

  // Current order status
  status: { 
    type: String, 
    enum: [
      'Pending',     // Waiting for payment (only for online payments)
      'Paid',        // Payment successful (online)
      'COD',         // Cash on Delivery (order placed)
      'Processing',  // Order is being prepared/packed
      'Shipped',     // Order has been shipped
      'Delivered',   // Order delivered successfully
      'Cancelled',   // Order has been cancelled
      'Failed'       // Payment failed
    ], 
    default: 'Pending' 
  },

  // Payment ID (from online payment gateway)
  paymentId: { type: String },

  // ✅ Prescription Image URL (নতুন ফিল্ড)
  prescription: { type: String },

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