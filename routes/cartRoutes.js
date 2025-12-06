// medicine-shop/routes/cartRoutes.js

const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const upload = require('../middleware/uploadImage'); // ✅ ইমেজ আপলোড মিডলওয়্যার ইম্পোর্ট

const {
  getCartItems,
  addToCart,
  removeFromCart,
  checkout
} = require('../controllers/cartController');

// -------------------------------------------------------------
// 🛒 Cart Routes
// These routes match the rewrite rules you defined in vite.config.js
// -------------------------------------------------------------

// GET /api/cart
router.get('/', authenticateToken, getCartItems);

// POST /api/cart/add
router.post('/add', authenticateToken, addToCart);

// DELETE /api/cart/remove/:id
router.delete('/remove/:id', authenticateToken, removeFromCart);

// POST /api/cart/checkout
// ✅ চেকআউট রাউটে ইমেজ আপলোড যুক্ত করা হলো
router.post('/checkout', authenticateToken, upload.single('prescription'), checkout);


// -------------------------------------------------------------
// 🧪 Debugging Route
// -------------------------------------------------------------
router.get('/test', (req, res) => {
  console.log("✅✅✅ TEST ROUTE HIT — Cart routes file is working! ✅✅✅");
  res.send('Cart routes file is working!');
});

module.exports = router;