
const nodemailer = require('nodemailer');
const emailConfig = require('../emailconfig');
const crypto = require('crypto');

// Function to generate a random UID of a specified length
function generateRandomUid(length) {
  const bytes = crypto.randomBytes(Math.ceil(length / 2));
  return bytes.toString('hex').slice(0, length);
}


function generateOTP() {
    // Generate a random 6-digit number
    const otp = Math.floor(100000 + Math.random() * 900000);
    return otp.toString();
  }

  function genRandomString() {
    const length = 10;
    const charset = 'ABCDEFGHIJKL0123456789MNOPQRSTUVWXYZ0123456789';
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

  function validatePanNumber(panNumber) {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
    return panRegex.test(panNumber);
  }

  function deleteFileWithRetry(path, maxRetries = 3, delay = 1000) {
    function attemptDeletion(retriesLeft) {
      fs.unlink(path, (err) => {
        if (err) {
          if (retriesLeft > 0) {
            console.error(`Error deleting ${path}. Retrying... (${retriesLeft} retries left)`);
            setTimeout(() => attemptDeletion(retriesLeft - 1), delay);
          } else {
            console.error(`Failed to delete ${path} after multiple attempts: ${err.message}`);
          }
        } else {
          console.log(`Successfully deleted ${path}`);
        }
      });
    }
  
    attemptDeletion(maxRetries);
  }

  module.exports = {
    generateOTP: generateOTP,
    sendVerificationEmail: sendVerificationEmail,
    genRandomString:genRandomString,
    validatePanNumber:validatePanNumber,
    generateRandomUid:generateRandomUid,
    deleteFileWithRetry:deleteFileWithRetry
  };