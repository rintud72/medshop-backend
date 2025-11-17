// medicine-shop/routes/cartRoutes.js

const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');

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
// (From Vite → /api/orders/cart)
router.get('/', authenticateToken, getCartItems);

// POST /api/cart/add
// (From Vite → /api/orders/add-to-cart)
router.post('/add', authenticateToken, addToCart);

// DELETE /api/cart/remove/:id
// (From Vite → /api/orders/remove-from-cart/:id)
router.delete('/remove/:id', authenticateToken, removeFromCart);

// POST /api/cart/checkout
// (From Vite → /api/orders/checkout)
router.post('/checkout', authenticateToken, checkout);


// -------------------------------------------------------------
// 🧪 Debugging Route
// This helps verify whether the cart routes file is working correctly.
// -------------------------------------------------------------
router.get('/test', (req, res) => {
  console.log("✅✅✅ TEST ROUTE HIT — Cart routes file is working! ✅✅✅");
  res.send('Cart routes file is working!');
});

module.exports = router;
