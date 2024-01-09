const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/users');
const Business = require('../models/business');
const Helper = require('../helper/function');
const router = express.Router();
const jwt = require('jsonwebtoken');


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

        const otapa = Helper.generateOTP();       
        // Create a new user
        const newUser = new User({
          email:email,
          password: hashedPassword,
          userId:email,
          otp: otapa
        });
    
        // Save the user to the database
        const issave = await newUser.save();
        if(issave){
          const emailResponse = await Helper.sendVerificationEmail(email, otapa);

          if (emailResponse.success) {
            return res.status(200).json({ message: 'User registered successfully! Email Verification OTP sent' });
              // Additional logic for OTP verification or other actions
          } else {
              console.error('Failed to send email:', emailResponse.message);
              return res.status(400).json({ error: 'Something Went Wrong' });
              // Handle error accordingly
          }
        } else {
          return res.status(500).json({ error: 'Internal server error' });
        }
    
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
      const expire = OTPI.expires_at;
      console.log("db_expire_time", expire);
      console.log("current_time", new Date());
      const dbExpireTime = new Date(expire);
      const currentTime = new Date();

if (dbExpireTime >= currentTime) {
      const result = await User.updateOne({ email: email }, { $set: { isVerified: true } });
      if (result.modifiedCount > 0) {
        return res.status(200).json({ message: 'User with email '+email+' Verified successfully.' });
      } else {
        return res.status(400).json({ error: 'User with email '+email+' not Verified' });
      }
    //console.log("Now Time",new Date());
    //const otpchk = await User.findOne({ email: email, otp: otp, expires_at: { $lt: new Date() } });
    } else {
      return res.status(400).json({ error: 'OTP Expired', message: 'OTP Expired' });   
    }
    }
   
})

router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // Find the user in the database
      const user = await User.findOne({ 
       isVerified: true, 
       email: email,
       });
      
      if(!user){
        res.status(401).json({ error: 'Email Not Verified' });
      } else if (!(await bcrypt.compare(password, user.password))) {
        res.status(401).json({ error: 'Invalid credentials' });
      } else if(user && await bcrypt.compare(password, user.password)){
        // jwt Token
        const jwtkey="cd9270cce63517ac6beb96eyr76nj973jdol329bhd90c21c27268b3bbfcdd20e3"
                  const payload = {
                    sub: email,
                    iat: Math.floor(Date.now() / 1000),
                  };
                  let token=jwt.sign(payload,jwtkey,{
                    expiresIn:"24h"
                  })
        res.status(200).json({ success:true, message: 'Login successful',token });
      }
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.post('/resend', async (req,res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }
      const existingUser = await User.findOne({ email });
        if (!existingUser) {
          return res.status(409).json({ error: 'Email not exist' });
        }
      const otapa = Helper.generateOTP();
      if(otapa){
        const result = await User.updateOne({ email: email }, { $set: { otp: otapa, expires_at : new Date(Date.now() + 5 * 60 * 1000) } });
        if(result){
      const emailResponse = await Helper.sendVerificationEmail(email, otapa);
     
      if (emailResponse.success) {
        return res.status(200).json({ message: 'Resend Otp sent to Email' });
          // Additional logic for OTP verification or other actions
      } else {
          console.error('Failed to send email:', emailResponse.message);
          return res.status(400).json({ error: 'Something Went Wrong' });
          // Handle error accordingly
      }
    }
    }
    } catch (error) {
        return res.status(422).json({ errors: validationErrors });
    }
  })

  router.post('/createBusiness', async (req, res) => {
    try {

      const { user_id, business_name, business_address, business_location, business_pin, business_phone } = req.body;

      // Check for required fields
      if (!user_id || !business_name || !business_address || !business_location || !business_pin || !business_phone) {
          return res.status(400).json({ error: 'All required fields must be provided.' });
      }

      const existingUser = await User.findOne({ email : user_id });
        if (!existingUser) {
          return res.status(409).json({ error: 'User Not Exist' });
        }
        // Generate a random business code
        const businessCode = Math.floor(Math.random() * (9999999999 - 100000000 + 1)) + 100000000;

        // Create a new business instance
        const business = new Business({
            user_id: req.body.user_id,
            business_name: req.body.business_name,
            business_address: req.body.business_address,
            business_location: req.body.business_location,
            business_pin: req.body.business_pin,
            business_phone: req.body.business_phone,
            business_code: businessCode,
        });

        // Save the business to the database
        const savedBusiness = await business.save();
        if(savedBusiness){
        return res.status(200).json({ message: 'Business '+business_name+' Added successfully.' });
        }
    } catch (error) {
        return res.status(422).json({ errors: validationErrors });
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