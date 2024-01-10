
const nodemailer = require('nodemailer');
const emailConfig = require('../emailconfig');

function generateOTP() {
    // Generate a random 6-digit number
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp.toString();
  }

  function genRandomString() {
    const length = 10;
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
  
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      result += charset.charAt(randomIndex);
    }
  
    return result;
  } 

  async function sendVerificationEmail(email, otp) {
    try {
        // Create a nodemailer transporter with your email service credentials
        var transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
              user: emailConfig.user,
              pass: emailConfig.pass
          }
        });

        // HTML template for the email
        const htmlTemplate = `
            <p>Hello,</p>
            <p>Your OTP for verification is: <strong>${otp}</strong></p>
            <p>Thank you for using our service.</p>
        `;

        const info = await transporter.sendMail({
            from: 'NEW PROJECT ID<newprojectid@gmail.com>',
            to: email,
            subject: 'OTP Verification',
            html: htmlTemplate
        });

        console.log(`Email sent: ${info.messageId}`);
        return { success: true, message: 'Email sent successfully.' };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, message: 'Error sending email.' };
    }
  }

  module.exports = {
    generateOTP: generateOTP,
    sendVerificationEmail: sendVerificationEmail,
    genRandomString:genRandomString
  };