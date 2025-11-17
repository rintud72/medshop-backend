// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const { createOrder, getMyOrders } = require('../controllers/orderController');

// Get current user's orders
router.get('/my', authenticateToken, getMyOrders);

// Create a new order
router.post('/', authenticateToken, createOrder);

module.exports = router;
