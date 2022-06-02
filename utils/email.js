const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const smtpTransporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: `Touropedia <${process.env.EMAIL_FROM}>`,
    to: options.email,
    subject: options.subject,
    message: options.message,
    html: options.html,
  };

  return await smtpTransporter.sendMail(mailOptions);
};

module.exports = sendEmail;
