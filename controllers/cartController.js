// medicine-shop/controllers/cartController.js

const mongoose = require('mongoose'); 
// 👉 Mongoose imported because we need transaction support for checkout

const User = require('../models/user');
const Medicine = require('../models/medicine');
const Order = require('../models/order');


// ======================================================================
// ✅ GET /api/cart
//    Fetch all cart items (Pending orders) for a logged-in user
// ======================================================================
exports.getCartItems = async (req, res) => {
  try {
    const userId = req.user.userId; 
    // 👉 req.user contains logged-in user data (from JWT middleware)

    // 👉 Fetch all "Pending" orders & populate medicine details
    const cartItems = await Order.find({ userId, status: 'Pending' })
      .populate('medicineId', 'name price image stock');

    res.json({ cart: { items: cartItems } });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ message: 'Error fetching cart items' });
  }
};



// ======================================================================
// ✅ POST /api/cart/add
//    Add a new item to cart or update quantity if already exists
// ======================================================================
exports.addToCart = async (req, res) => {
  try {
    const { medicineId, quantity } = req.body;
    const userId = req.user.userId;

    // 👉 First, check if the medicine exists
    const medicine = await Medicine.findById(medicineId);
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }

    // 👉 Check if the user already has this medicine in his cart
    let existingCartItem = await Order.findOne({
      userId,
      medicineId,
      status: 'Pending',
    });

    if (existingCartItem) {
      // ❗ If item already exists, we increase the quantity
      const newQuantity = existingCartItem.quantity + quantity;

      // 👉 Validate stock before updating quantity
      if (medicine.stock < newQuantity) {
        return res.status(400).json({
          message: `Not enough stock. Only ${medicine.stock} left.`,
        });
      }

      existingCartItem.quantity = newQuantity;
      await existingCartItem.save();

      res.json({
        message: 'Item quantity updated in cart',
        order: existingCartItem,
      });

    } else {
      // 👉 If item does not exist in cart, add new one
      if (medicine.stock < quantity) {
        return res.status(400).json({
          message: `Not enough stock. Only ${medicine.stock} left.`,
        });
      }

      // 👉 Create a new order entry representing a cart item
      const newCartItem = new Order({
        userId,
        medicineId,
        quantity,
        priceAtOrder: medicine.price, // Save price at time of adding to cart
        status: 'Pending',
      });

      await newCartItem.save();

      res.status(201).json({
        message: 'Item added to cart',
        order: newCartItem,
      });
    }

  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ message: 'Error adding to cart' });
  }
};



// ======================================================================
// ✅ DELETE /api/cart/remove/:id
//    Remove a specific medicine from the user's cart
// ======================================================================
exports.removeFromCart = async (req, res) => {
  try {
    const medicineId = req.params.id; 
    // 👉 This is the medicineId passed in the URL

    const userId = req.user.userId;

    // 👉 Delete only if the item exists as a Pending cart item
    const result = await Order.deleteOne({
      userId,
      medicineId,
      status: 'Pending',
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    res.json({ message: 'Item removed from cart' });

  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ message: 'Error removing from cart' });
  }
};



// ======================================================================
// ✅ POST /api/cart/checkout
//    Convert all Pending cart items to COD orders
//    - Validates shipping address
//    - Uses MongoDB transaction for safety
//    - Reduces stock for each medicine
// ======================================================================
exports.checkout = async (req, res) => {
  // 👉 Extract address from request body
  const { address } = req.body;

  // 👉 Validate shipping address
  if (
    !address ||
    !address.street ||
    !address.city ||
    !address.postalCode ||
    !address.phone
  ) {
    return res.status(400).json({
      message:
        'Shipping address is incomplete. Please provide street, city, postalCode, and phone.',
    });
  }

  // 👉 Start a new MongoDB session for transaction
  const session = await mongoose.startSession();

  try {
    const userId = req.user.userId;
    const paymentMethod = 'COD'; // Cash On Delivery

    // 👉 Begin transaction
    await session.withTransaction(async () => {
      // 👉 Get all pending cart items
      const cartItems = await Order.find({
        userId,
        status: 'Pending',
      }).session(session);

      if (cartItems.length === 0) {
        throw new Error('Your cart is empty!');
      }

      // 👉 Process each cart item one-by-one
      for (const item of cartItems) {
        // Fetch the medicine for this cart item
        const medicine = await Medicine.findById(item.medicineId).session(
          session
        );

        if (!medicine) {
          throw new Error(`Medicine ID ${item.medicineId} not found.`);
        }

        // 👉 Check stock availability
        if (medicine.stock < item.quantity) {
          throw new Error(
            `Not enough stock for ${medicine.name}. Only ${medicine.stock} left.`
          );
        }

        // 👉 Reduce stock
        medicine.stock -= item.quantity;
        await medicine.save({ session });

        // 👉 Convert cart order to COD order & save shipping address
        item.status = paymentMethod;
        item.address = address;
        await item.save({ session });
      }
    });

    // 👉 End session & return success response
    await session.endSession();
    res.json({ message: 'Checkout successful! Order placed.' });

  } catch (error) {
    // 👉 Any error → transaction auto-rollbacks
    await session.endSession();
    console.error('Error during checkout transaction:', error);

    res.status(500).json({
      message: error.message || 'Error during checkout',
    });
  }
};
