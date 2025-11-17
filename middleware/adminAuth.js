function adminAuth(req, res, next) {
  const user = req.user; // The user object is assumed to be attached from JWT middleware

  // Check if the logged-in user has admin privileges
  if (user && user.role === 'ADMIN') {
    next(); // Allow the request to continue
  } else {
    // Deny access if the user is not an admin
    res.status(403).json({ message: 'Access denied: Admin privileges required.' });
  }
}

module.exports = adminAuth;
