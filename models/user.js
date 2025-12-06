const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ✅ Address Schema added (to store multiple user addresses)
const addressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  phone: { type: String, required: true },
});

const userSchema = new mongoose.Schema({
  // User's full name
  name: { type: String, required: true },

  // User's unique email
  email: { type: String, required: true, unique: true },

  // Hashed password
  password: { type: String, required: true },

  // OTP for phone verification
  phoneOtp: { type: String },

  // OTP expiration time
  otpExpiresAt: { type: Date },

  // Whether the user account is verified
  isVerified: { type: Boolean, default: false },

  // User role (normal user or admin)
  role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
  
  // ✅ Array of saved addresses for the user
  addresses: [addressSchema],

  // ✅ Wishlist ekhane add kora holo (Schema-r bhetore)
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' }]
});

// -------------------------------------------------------------
// 🔒 Middleware: Hash password before saving to database
// -------------------------------------------------------------
userSchema.pre('save', async function (next) {
  // Only hash if password is modified
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// -------------------------------------------------------------
// 🔐 Helper Method: Compare entered password with stored hash
// -------------------------------------------------------------
userSchema.methods.matchPassword = async function (enteredPassword) {
  console.log('enteredPassword:', enteredPassword);
  console.log('db password:', this.password);
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);