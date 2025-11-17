const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  // Extract the token from the Authorization header
  const authHeader = req.headers['authorization'];

  // The token is expected in the format: "Bearer TOKEN"
  const token = authHeader && authHeader.split(' ')[1];

  // If no token is found, deny access
  if (!token) {
    return res.status(401).json({ message: 'Access denied, no token provided' });
  }

  // Verify the provided JWT token
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    // If valid, attach the user data from the token to the request object
    req.user = user;

    // Continue to the next middleware or route handler
    next();
  });
}

module.exports = authenticateToken;
