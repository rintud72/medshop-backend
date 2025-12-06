const Review = require('../models/review');

// ✅ নতুন রিভিউ যোগ করা
exports.addReview = async (req, res) => {
  try {
    const { medicineId, rating, comment } = req.body;
    const userId = req.user.userId;

    if (!medicineId || !rating || !comment) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newReview = new Review({
      medicineId,
      userId,
      rating,
      comment
    });

    await newReview.save();

    // ইউজারের নামসহ রিভিউ রিটার্ন করা
    const populatedReview = await Review.findById(newReview._id).populate('userId', 'name');

    res.status(201).json({ message: "Review added successfully", review: populatedReview });
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({ message: "Failed to add review" });
  }
};

// ✅ একটি মেডিসিনের সব রিভিউ পাওয়া
exports.getReviews = async (req, res) => {
  try {
    const { medicineId } = req.params;
    const reviews = await Review.find({ medicineId }).populate('userId', 'name').sort({ createdAt: -1 });
    
    res.json({ reviews });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
};