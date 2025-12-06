const User = require('../models/user');
// ✅ Medicine মডেল ইম্পোর্ট করা হলো (Wishlist পপুলেট করার জন্য বা চেক করার জন্য লাগতে পারে)
const Medicine = require('../models/medicine'); 
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const generateOTP = require('../utils/otpgenerator');
const sendEmail = require('../utils/sendEmail');

// =======================
// 🧾 REGISTER USER + SEND OTP
// (আপডেট করা হয়েছে: এখন role ইনপুট নেওয়া হবে)
// =======================
exports.registerUser = async (req, res) => {
  try {
    // ✅ আপডেট: role ডি-স্ট্রাকচার করা হলো
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      // Case 1: ইউজার আছে এবং ভেরিফায়েড
      if (existingUser.isVerified) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }

      // Case 2: ইউজার আছে কিন্তু ভেরিফায়েড নয় (আটকে যাওয়া ইউজার)
      const otp = generateOTP(6);
      const otpExpiry = Date.now() + 10 * 60 * 1000; 

      existingUser.name = name;
      existingUser.password = password; 
      existingUser.phoneOtp = otp;
      existingUser.otpExpiresAt = otpExpiry;
      // বিদ্যমান আনভেরিফাইড ইউজারের রোলও আপডেট চাইলে এখানে existingUser.role = role || 'USER'; যোগ করতে পারেন

      await existingUser.save();       
      console.log("TEST OTP (Resend):", otp);

      const subject = 'OTP Verification - Medicine Shop';
      const text = `Hello ${name},\n\nYour NEW OTP for verification is: ${otp}\nThis OTP will expire in 10 minutes.\n\n- Medicine Shop`;
      await sendEmail(email, subject, text);

      return res.status(201).json({ message: 'OTP sent to your email. Please verify your account.' });

    } else {
      // Case 3: সম্পূর্ণ নতুন ইউজার
      const otp = generateOTP(6);
      const otpExpiry = Date.now() + 10 * 60 * 1000;

      const newUser = new User({
        name,
        email,
        password,
        phoneOtp: otp,
        otpExpiresAt: otpExpiry,
        isVerified: false,
        // ✅ আপডেট: role সেট করা হলো (ডিফল্ট 'USER')
        role: role || 'USER'
      });

      await newUser.save();
      console.log("TEST OTP (New User):", otp);

      const subject = 'OTP Verification - Medicine Shop';
      const text = `Hello ${name},\n\nYour OTP for verification is: ${otp}\nThis OTP will expire in 10 minutes.\n\n- Medicine Shop`;
      await sendEmail(email, subject, text);

      return res.status(201).json({ message: 'OTP sent to your email. Please verify your account.' });
    }

  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
};


// =======================
// 🔐 VERIFY OTP
// =======================
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.isVerified) return res.json({ message: 'User already verified' });
    if (user.phoneOtp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
    if (Date.now() > user.otpExpiresAt) return res.status(400).json({ message: 'OTP expired' });

    user.isVerified = true;
    user.phoneOtp = null;
    user.otpExpiresAt = null;
    await user.save();

    res.json({ message: 'User verified successfully ✅' });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ message: 'Error verifying OTP', error: error.message });
  }
};


// =======================
// 🔓 LOGIN USER
// =======================
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !user.isVerified) {
      return res.status(404).json({ message: 'User not registered. Register first.' });
    }

    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid password. Please try again.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Login successful ✅',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        wishlist: user.wishlist, // ✅ এই লাইনটি যোগ করা হলো
        addresses: user.addresses
      },
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
};


// =======================
// 🔁 FORGOT PASSWORD (SEND OTP)
// =======================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: 'User not found' });

    const otp = generateOTP(6);
    user.phoneOtp = otp;
    user.otpExpiresAt = Date.now() + 10 * 60 * 1000;
    await user.save();

    const subject = 'Reset Password OTP - Medicine Shop';
    const text = `Your OTP for resetting the password is: ${otp}. It will expire in 10 minutes.`;
    await sendEmail(email, subject, text);

    res.json({ message: 'Password reset OTP sent to your email.' });
  } catch (error) {
    console.error('Error sending reset OTP:', error);
    res.status(500).json({ message: 'Error sending reset OTP', error: error.message });
  }
};


// =======================
// 🔐 VERIFY RESET OTP
// =======================
exports.verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.phoneOtp !== otp) return res.status(400).json({ message: 'Invalid OTP' });
    if (Date.now() > user.otpExpiresAt) return res.status(400).json({ message: 'OTP expired' });

    res.json({ message: 'OTP verified. You can now reset your password.' });
  } catch (error) {
    console.error('Error verifying reset OTP:', error);
    res.status(500).json({ message: 'Error verifying reset OTP', error: error.message });
  }
};


// =======================
// 🔐 RESET PASSWORD
// =======================
exports.resetPassword = async (req, res) => {
  try {
    const { email, newPassword, otp } = req.body;

    console.log("🔁 Reset Password called for:", email);

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.phoneOtp !== otp || Date.now() > user.otpExpiresAt) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.password = newPassword;
    user.phoneOtp = null;
    user.otpExpiresAt = null;

    const updatedUser = await user.save();

    console.log("✅ Password reset for", email);
    console.log("🔒 New hash:", updatedUser.password);

    res.json({ message: "Password reset successfully ✅ You can now log in with your new password." });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Error resetting password", error: error.message });
  }
};


// =======================
// 👤 GET LOGGED-IN USER PROFILE
// =======================
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).select("-password -phoneOtp -otpExpiresAt");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ user });
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Error fetching profile", error: error.message });
  }
};


// =======================
// ✏️ UPDATE USER PROFILE
// =======================
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, email } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email },
      { new: true, runValidators: true }
    ).select("-password -phoneOtp -otpExpiresAt");

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.json({ message: "Profile updated successfully ✅", user: updatedUser });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
};


// =======================
// 🏠 GET USER ADDRESSES
// =======================
exports.getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ addresses: user.addresses });
  } catch (error) {
    console.error("Error fetching addresses:", error);
    res.status(500).json({ message: "Error fetching addresses" });
  }
};


// =======================
// ➕ ADD USER ADDRESS
// =======================
exports.addAddress = async (req, res) => {
  try {
    const { street, city, postalCode, phone } = req.body;

    if (!street || !city || !postalCode || !phone) {
      return res.status(400).json({ message: "All address fields are required" });
    }

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const newAddress = { street, city, postalCode, phone };
    user.addresses.push(newAddress);
    await user.save();

    res.status(201).json({ message: "Address added successfully", addresses: user.addresses });
  } catch (error) {
    console.error("Error adding address:", error);
    res.status(500).json({ message: "Error adding address" });
  }
};


// =======================
// ❌ DELETE USER ADDRESS
// =======================
exports.deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.addresses.pull({ _id: addressId });
    await user.save();
    
    res.json({ message: "Address deleted successfully", addresses: user.addresses });
  } catch (error) {
    console.error("Error deleting address:", error);
    res.status(500).json({ message: "Error deleting address" });
  }
};


// =======================
// 🔒 CHANGE PASSWORD
// =======================
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password changed successfully ✅" });
    
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Error changing password", error: error.message });
  }
};


// =======================
// ❤️ TOGGLE WISHLIST (Add/Remove)
// =======================
exports.toggleWishlist = async (req, res) => {
  try {
    const { medicineId } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // চেক করা হচ্ছে মেডিসিনটি ইতিমধ্যে উইশলিস্টে আছে কিনা
    const index = user.wishlist.indexOf(medicineId);

    if (index === -1) {
      // নেই, তাই যোগ করুন
      user.wishlist.push(medicineId);
      await user.save();
      res.json({ message: "Added to wishlist", wishlist: user.wishlist });
    } else {
      // আছে, তাই সরিয়ে ফেলুন
      user.wishlist.splice(index, 1);
      await user.save();
      res.json({ message: "Removed from wishlist", wishlist: user.wishlist });
    }
  } catch (error) {
    console.error("Wishlist error:", error);
    res.status(500).json({ message: "Error updating wishlist" });
  }
};


// =======================
// 📜 GET WISHLIST
// =======================
exports.getWishlist = async (req, res) => {
  try {
    const userId = req.user.userId;
    // populate() ব্যবহার করে medicineId থেকে মেডিসিনের নাম, দাম, ছবি নিয়ে আসা হচ্ছে
    const user = await User.findById(userId).populate('wishlist'); 
    
    res.json({ wishlist: user.wishlist });
  } catch (error) {
    console.error("Get wishlist error:", error);
    res.status(500).json({ message: "Error fetching wishlist" });
  }
};