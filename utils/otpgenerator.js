/**
 * Generates a numeric OTP (One-Time Password)
 *
 * @param {number} length - Length of the OTP to generate (default: 6)
 * @returns {string} - Returns a string containing the generated OTP
 *
 * Example:
 *   generateOTP(6) → "492817"
 */
function generateOTP(length = 6) {

  // All possible digits for OTP
  const digits = '0123456789';

  // Variable to store final OTP
  let otp = '';

  /**
   * Loop runs "length" number of times
   * e.g., if length = 6 → loop runs 6 times
   */
  for (let i = 0; i < length; i++) {

    /**
     * Math.random() returns a decimal between 0 and 1
     * Math.random() * 10 → random number between 0 and 9.999...
     * Math.floor(...) → converts decimal to whole number 0–9
     *
     * digits[...] → picks a digit from the digits string by index
     */
    otp += digits[Math.floor(Math.random() * 10)];
  }

  // Return the complete OTP string
  return otp;
}

module.exports = generateOTP;
