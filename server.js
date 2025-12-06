require('dotenv').config(); // Load environment variables from .env

const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const helmet = require('helmet'); // Security middleware
const path = require("path");
const cors = require("cors");

// 📌 Importing All Routes
const userRoutes = require('./routes/userRoutes');
const medicineRoutes = require('./routes/medicineRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require("./routes/adminRoutes");
const cartRoutes = require('./routes/cartRoutes'); 
const reviewRoutes = require('./routes/reviewRoutes');



// 🔹 Supabase Storage Client Setup
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);


// --------------------------------------------------------
// 🌐 CORS Configuration
// --------------------------------------------------------
// CORS allows your frontend (React/Vite/Netlify) to access the API.
// `credentials: true` lets cookies and headers pass securely.
//
app.use(cors({
  origin: [
    "http://localhost:5173",                         // Local development frontend
    "https://medshop-app.onrender.com" // Production frontend
  ],
  credentials: true
}));
// --------------------------------------------------------
// 🔐 Helmet Middleware (Security)
// --------------------------------------------------------
// Normally Helmet blocks loading external images for safety.
// But since your images are stored locally in /uploads and
// accessed from frontend, cross-origin access must be allowed.
// This config lets images load properly without breaking security.
//
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);





// --------------------------------------------------------
// 🧰 Body Parser + JSON Middleware
// --------------------------------------------------------
// Allows server to read JSON data from request body.
//
app.use(bodyParser.json());
app.use(express.json());


// --------------------------------------------------------
// 🚏 Route Handlers
// --------------------------------------------------------
// All API routes are grouped and managed cleanly.
//
app.use('/api/users', userRoutes);        // User registration, login, profile, addresses
app.use('/api/medicines', medicineRoutes); // Medicine CRUD routes
app.use('/api/orders', orderRoutes);       // User order routes
app.use('/api/payments', paymentRoutes);   // Payment (Stripe/Razorpay) routes
app.use("/api/admin", adminRoutes);        // Admin authentication + dashboard routes
app.use('/api/cart', cartRoutes);          // User cart routes
app.use('/api/reviews', reviewRoutes);

// --------------------------------------------------------
// 🖼️ Static File Serving (Uploads Folder)
// --------------------------------------------------------
// Makes uploaded images accessible publicly.
// Example URL: http://localhost:5000/uploads/image.jpg
//
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


// --------------------------------------------------------
// 🗄️ MongoDB Connection
// --------------------------------------------------------
// Connects to MongoDB using connection string from .env
// Logs success or failure.
//
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.log('❌ MongoDB error:', err));


// --------------------------------------------------------
// 🚀 Start Server
// --------------------------------------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
