const SibApiV3Sdk = require('@brevo/client');

const sendEmail = async (to, subject, text) => {
  try {
    let apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    
    // API key-ti environment variable theke set kora
    let apiKey = apiInstance.authentications['apiKey'];
    apiKey.apiKey = process.env.BREVO_API_KEY;

    let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    sendSmtpEmail.subject = subject;
    // Plain text-ke HTML-e rupantor kora jate line break-gulo thake
    sendSmtpEmail.htmlContent = `<p>${text.replace(/\n/g, '<br>')}</p>`; 
    
    sendSmtpEmail.sender = { 
      name: "MedShop", 
      email: process.env.BREVO_SENDER_EMAIL // Apnar Brevo-te verify kora email
    };
    sendSmtpEmail.to = [{ email: to }];

    // API call kore email pathano
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    
    console.log(`✔ Email sent successfully to ${to} via Brevo`);

  } catch (error) {
    // Brevo-r error-gulo aro bistarito dekhay
    console.error('✘ Error sending email via Brevo:', error.response ? error.response.body : error.message);
    throw new Error('Failed to send email');
  }
};

module.exports = sendEmail;