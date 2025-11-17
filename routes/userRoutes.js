const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');

const {
  registerUser,
  loginUser,
  verifyOtp,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  getProfile,
  updateProfile,
  getAddresses,
  addAddress,
  deleteAddress,
  changePassword
} = require('../controllers/userController');


// ============================================================================
// 🧑‍💻 AUTHENTICATION & ACCOUNT CREATION ROUTES
// ============================================================================

// 📌 Registers a new user and sends OTP for email verification
router.post('/register', registerUser);

// 📌 Verifies the OTP sent during registration (activates user account)
router.post('/verify-otp', verifyOtp);

// 📌 Logs user into the system (requires verified account)
router.post('/login', loginUser);



// ============================================================================
// 🔐 PASSWORD RECOVERY ROUTES
// ============================================================================

// 📌 Sends OTP to user's email for password reset
router.post('/forgot-password', forgotPassword);

// 📌 Verifies OTP submitted during password reset process
router.post('/verify-reset-otp', verifyResetOtp);

// 📌 Resets user password after OTP is verified
router.post('/reset-password', resetPassword);



// ============================================================================
// 👤 USER PROFILE ROUTES (Protected — requires valid JWT token)
// ============================================================================

// 📌 Fetch logged-in user's profile (name, email, role, etc.)
router.get('/profile', authenticateToken, getProfile);

// 📌 Update logged-in user's name or email
router.put('/profile', authenticateToken, updateProfile);



// ============================================================================
// 🏠 USER ADDRESS MANAGEMENT (Multiple addresses supported)
// ============================================================================

// 📌 Get all saved addresses of the logged-in user
router.get('/profile/addresses', authenticateToken, getAddresses);

// 📌 Add a new address to the user's address list
router.post('/profile/addresses', authenticateToken, addAddress);

// 📌 Delete a specific address by ID
router.delete('/profile/addresses/:addressId', authenticateToken, deleteAddress);



// ============================================================================
// 🔒 USER PASSWORD MANAGEMENT
// ============================================================================

// 📌 Change password from profile (requires current password)
router.put('/profile/change-password', authenticateToken, changePassword);



module.exports = router;
