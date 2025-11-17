const nodemailer = require('nodemailer');

/**
 * sendEmail - A reusable utility function to send emails
 *
 * @param {string} to - Recipient's email address
 * @param {string} subject - Email subject line
 * @param {string} text - Email body text (plain text)
 *
 * This function centralizes email sending logic so that
 * all controllers can call this function instead of repeating nodemailer setup.
 */
const sendEmail = async (to, subject, text) => {
  try {

    /**
     * Create a transporter using Gmail SMTP service.
     * The user and pass are stored in environment variables for security.
     * 
     * IMPORTANT:
     * For Gmail, make sure:
     *   → "Less secure app access" is OFF for normal accounts
     *   → Or use "App Password" for accounts with 2-step verification
     */
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Your Gmail address
        pass: process.env.EMAIL_PASS, // App Password or Gmail password
      },
    });

    /**
     * Send the actual email.
     * 'text' is plain text content.
     * If you want formatted HTML emails, you can also use 'html' field.
     */
    await transporter.sendMail({
      from: `"Medicine Shop" <${process.env.EMAIL_USER}>`, // Sender name + email
      to: to,                                              // Recipient email
      subject: subject,                                    // Email subject
      text: text,                                          // Plain text content
      // html: `<p>${text}</p>` // (optional) If you want HTML emails later
    });

    console.log(`✔ Email sent successfully to ${to}`);

  } catch (error) {

    // Display full error in terminal for debugging
    console.error('✘ Error sending email:', error);

    // Throw an error so the controller can handle it
    throw new Error('Failed to send email');
  }
};

module.exports = sendEmail;
