const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/users');
const Helper = require('../helper/function');
const router = express.Router();
const nodemailer = require('nodemailer');
const emailConfig = require('../emailconfig');

router.get("/dashboard", async (req,res) =>{
 
})

router.post("/register", async (req,res) =>{
    try {
        const { email, password } = req.body;
        
        console.log("email",email);
        console.log("password",password);
        // Validate email and password
        if (!email || !password) {
          return res.status(400).json({ error: 'Email and password are required' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(409).json({ error: 'Email already registered' });
        }
    
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        
        // Create a new user
        const newUser = new User({
          email:email,
          password: hashedPassword,
          userId:email,
          otp: Helper.generateOTP()
        });
    
        // Save the user to the database
        await newUser.save();
    
        return res.status(200).json({ message: 'User registered successfully' });
      } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
      }
})

router.post('/verify', async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ error: 'Email and OTP are required' });
      }

    const OTPI = await User.findOne({ email: email, otp: otp});
    if(!OTPI){
        return res.status(400).json({ error: 'Invalid OTP', message: 'Invalid OTP' });   
    } else if(OTPI){
    console.log("Now Time",new Date());
    const otpchk = await User.findOne({ email: email, otp: otp, expires_at: { $gt: new Date() } });

    if (!otpchk) {
      console.log('OTP has expired.');
      return res.status(400).json({ error: 'OTP has expired' });
    } else {

        const result = await User.updateOne({ email: email }, { $set: { isVerified: true } });

        if (result.modifiedCount > 0) {
          return res.status(200).json({ message: 'User with email '+email+' Verified successfully.' });
        } else {
          return res.status(400).json({ error: 'User with email '+email+' not Verified' });
        }
       
      // You can continue with your verification logic here
    }
   }
})

router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // Find the user in the database
      const user = await User.findOne({ 
       isVerify: true, 
       email: email,
       });
      
      if(!user){
        res.status(401).json({ error: 'Email Not Verified' });
      } else if (!(await bcrypt.compare(password, user.password))) {
        res.status(401).json({ error: 'Invalid credentials' });
      } else {
        res.status(200).json({ message: 'Login successful' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

router.post("/sendEMail", async (req,res) => {
    try {
    const { email } = req.body;

    var transporter = nodemailer.createTransport({
        host: "sandbox.smtp.mailtrap.io",
        port: 2525,
        auth: {
            user: emailConfig.user,
            pass: emailConfig.pass,
        }
      });
      

      const sixDigitOTP = Helper.generateOTP();
      console.log("Generated OTP:", sixDigitOTP);

      // Email options
      const mailOptions = {
        from: 'newprojectid@gmail.com',
        to: email,
        subject: 'Sending Email Verification OTP',
        text: 'YOUR OTP for email verification is '+sixDigitOTP,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return console.error('Error sending email:', error);
        }
        console.log('Email sent:', info.response);
      });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error });
      }
})

router.get("/direct-list", async (req,res)=>{
    
})

router.get("/team-list", async()=>{

})

router.get("/level-income", async()=>{

})

router.get("/rank-bonus", async()=>{

})

router.get("/stake-list", async()=>{
    
})

router.get("/stake-list", async()=>{
    
})

router.get("/pool-income", async()=>{
    
})

router.get("/claimed", async()=>{
    
})

module.exports = router;