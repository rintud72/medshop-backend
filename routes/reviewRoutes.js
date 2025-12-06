const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const { addReview, getReviews } = require('../controllers/reviewController');

// ➕ রিভিউ যোগ করার রাউট (লগইন করা থাকতে হবে)
router.post('/', authenticateToken, addReview);

// 📜 রিভিউ দেখার রাউট (সবার জন্য উন্মুক্ত)
router.get('/:medicineId', getReviews);

module.exports = router;