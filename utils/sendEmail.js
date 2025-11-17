const SibApiV3Sdk = require('@getbrevo/brevo'); // ✅ Poriborton: '@brevo/client' noy

const sendEmail = async (to, subject, text) => {
  try {
    let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    
    // API key-ti environment variable theke set kora
    let apiKey = apiInstance.authentications['apiKey'];
    apiKey.apiKey = process.env.BREVO_API_KEY;

    let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = `<p>${text.replace(/\n/g, '<br>')}</p>`; // Text-ke HTML-e rupantor
    sendSmtpEmail.sender = { 
      name: "MedShop", 
      email: process.env.BREVO_SENDER_EMAIL 
    };
    sendSmtpEmail.to = [{ email: to }];

    // API call kore email pathano
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    
    console.log(`✔ Email sent successfully to ${to} via Brevo`);

  } catch (error) {
    // Brevo-r error-gulo aro bistarito dekhay
    console.error('✘ Error sending email via Brevo (Full Error):', error);
    throw new Error('Failed to send email');
  }
};

module.exports = sendEmail;