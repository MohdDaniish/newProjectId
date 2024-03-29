const express = require('express');
const fetch = require('cross-fetch');
const bcrypt = require('bcrypt');
const User = require('../models/users');
const UserOtp = require('../models/user_otp');
const Business = require('../models/business');
const Category = require('../models/category');
const BusinessCategory = require('../models/business_category');
const Client = require('../models/client.js');
const Forgot = require('../models/forgot.js');
const Helper = require('../helper/function');
const router = express.Router();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const sizeOf = require('image-size');
const path = require('path');
const Aadhar = require('../models/aadhaar_detail.js');
const voter = require('../controller/voter.js');
const pan = require('../controller/pan.js');
const aadhaar = require('../controller/aadhaar.js');
const Pan = require('../models/pan.js');

router.post("/register", async (req,res) =>{
    try {
        const { email, password } = req.body;
        
        console.log("email",email);
        console.log("password",password);
        // Validate email and password
        if (!email || !password) {
          return res.status(200).json({ status:false, message:'Email and password are required', error: 'Email and password are required' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(200).json({ status:false, message:'Email already registered',error: 'Email already registered' });
        }
    
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        const otapa = Helper.generateOTP();  
        
        const existing = await UserOtp.findOne({ email });
        if(existing){
          const result = await UserOtp.updateOne({ email: email }, { $set: { password: hashedPassword, otp: otapa, expires_at : new Date(Date.now() + 5 * 60 * 1000) } });
          if (result.modifiedCount > 0) {
            const emailResponse = await Helper.sendVerificationEmail(email, otapa);
            if (emailResponse.success) {
              return res.status(200).json({status:true, message: 'Email Verification OTP sent' });
                // Additional logic for OTP verification or other actions
            } else {
                console.error('Failed to send email:', emailResponse.message);
                return res.status(200).json({ status:false, message:'Something Went Wrong',error: 'Something Went Wrong' });
                // Handle error accordingly
            }
          } else {
            return res.status(200).json({status:false, error: 'Something Went Wrong' });
          }
        } else {
        const newUser = new UserOtp({
          email:email,
          password: hashedPassword,
          otp: otapa
        });

        const issave = await newUser.save();
        if(issave){
          const emailResponse = await Helper.sendVerificationEmail(email, otapa);

          if (emailResponse.success) {
            return res.status(200).json({status:true, message: 'Email Verification OTP sent' });
              // Additional logic for OTP verification or other actions
          } else {
              console.error('Failed to send email:', emailResponse.message);
              return res.status(200).json({ status:false, message:'Something Went Wrong',error: 'Something Went Wrong' });
              // Handle error accordingly
          }
        } else {
          return res.status(200).json({ status:false,message:'Internal Server Error',error: 'Internal server error' });
        }
      }
       
      } catch (error) {
        console.error(error);
        return res.status(200).json({status:false, message:'Internal Server Error', error: 'Internal server error' });
      }
})

router.post('/verify', async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(200).json({ status:false, message:'Email and OTP are required',error: 'Email and OTP are required' });
      }

    const OTPI = await UserOtp.findOne({ email: email, otp: otp});
    if(!OTPI){
        return res.status(200).json({ status:false,error: 'Invalid OTP', message: 'Invalid OTP' });   
    } else if(OTPI){
      const expire = OTPI.expires_at;
      const password = OTPI.password;
      // console.log("db_expire_time", expire);
      // console.log("current_time", new Date());
      const dbExpireTime = new Date(expire);
      const currentTime = new Date();

if (dbExpireTime >= currentTime) {
  const prev = await User.findOne({ email });
  if(!prev){
      const newUser = new User({
          email:email,
          password: password,
          google_id:'',
          userId:email
        });
        const isave = await newUser.save();
      if (isave) {
        const jwtkey=process.env.JWT_SECRET
                  const payload = {
                    sub: email,
                    iat: Math.floor(Date.now() / 1000),
                  };
                  let token=jwt.sign(payload,jwtkey,{
                    expiresIn:"24h"
                  })
                  const data = { email: email, token: token };
                  return res.status(200).json({ status:true, message: 'Login successful',data:data });
      } else {
        return res.status(200).json({status:false, message:'User with email '+email+' not Verified', error: 'User with email '+email+' not Verified' });
      }
    } else {
      const payload = {
        sub: email,
        iat: Math.floor(Date.now() / 1000),
      };
      let token=jwt.sign(payload,jwtkey,{
        expiresIn:"24h"
      })
      const data = { email: email, token: token };
      return res.status(200).json({ status:true, message: 'Login successful',data:data });
    }
    //console.log("Now Time",new Date());
    //const otpchk = await User.findOne({ email: email, otp: otp, expires_at: { $lt: new Date() } });
    } else {
      return res.status(200).json({ status:false, error: 'OTP Expired', message: 'OTP Expired' });   
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
        res.status(200).json({status:false, message:'User Not Exist', error: 'User Not Exist' });
      } else if (!(await bcrypt.compare(password, user.password))) {
        res.status(200).json({ status:false, message:'Invalid credentials', error: 'Invalid credentials' });
      } else if(user && await bcrypt.compare(password, user.password)){
        // jwt Token
        const jwtkey=process.env.JWT_SECRET
                  const payload = {
                    sub: email,
                    iat: Math.floor(Date.now() / 1000),
                  };
                  let token=jwt.sign(payload,jwtkey,{
                    expiresIn:"24h"
                  })
                  const data = { email: email, token: token };
                  return res.status(200).json({ status:true, message: 'Login successful',data:data });
      }
    } catch (error) {
      res.status(200).json({ status:false, message:'Internal server error', error: error });
    }
  });

  router.post('/resend', async (req,res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(200).json({ status:false, message:'Email is required', error: 'Email is required' });
      }
      const existingUser = await UserOtp.findOne({ email });
        if (!existingUser) {
          return res.status(200).json({ status:false, message:'Email not exist', error: 'Email not exist' });
        }
      const otapa = Helper.generateOTP();
      if(otapa){
        const result = await UserOtp.updateOne({ email: email }, { $set: { otp: otapa, expires_at : new Date(Date.now() + 5 * 60 * 1000) } });
        if(result){
      const emailResponse = await Helper.sendVerificationEmail(email, otapa);
     
      if (emailResponse.success) {
        return res.status(200).json({ status:true,message: 'Resend Otp sent to Email' });
          // Additional logic for OTP verification or other actions
      } else {
          console.error('Failed to send email:', emailResponse.message);
          return res.status(200).json({ status:false, message:'Something Went Wrong', error: 'Something Went Wrong' });
          // Handle error accordingly
      }
    }
    }
    } catch (error) {
        return res.status(200).json({ status:false,errors: validationErrors });
    }
  })

  router.post('/createBusiness', async (req, res) => {
    try {

      const { user_id, business_name, business_address, business_location, business_city, business_state, business_country, business_pin, business_phone } = req.body;

      // Check for required fields
      if (!user_id || !business_name || !business_address || !business_location || !business_pin || !business_phone || !business_city || !business_state || !business_country) {
          return res.status(200).json({ status:false, message:'All required fields must be provided.', error: 'All required fields must be provided.' });
      }

      const existingUser = await User.findOne({ email : user_id });
        if (!existingUser) {
          return res.status(200).json({ status:false, message:'User Not Exist', error: 'User Not Exist' });
        }

        const isBiz = await Business.findOne({ email : user_id });
        if (isBiz) {
          return res.status(200).json({ status:false, message:'Business Already Added' });
        }

        // const existphone = await Business.findOne({ business_phone : business_phone });
        // if (existphone) {
        //   return res.status(200).json({ status:false, message:'Phone number Already used', error: 'Phone number Already used' });
        // }
        // Generate a random business code
        const businessCode = Helper.genRandomString();

        // Create a new business instance
        const business = new Business({
            user_id: req.body.user_id,
            business_name: req.body.business_name,
            business_address: req.body.business_address,
            business_city: req.body.business_city,
            business_state: req.body.business_state,
            business_country: req.body.business_country,
            business_location: req.body.business_location,
            business_pin: req.body.business_pin,
            business_phone: req.body.business_phone,
            business_code: businessCode,
        });

        // Save the business to the database
        const savedBusiness = await business.save();
        if(savedBusiness){
          const data = { email: user_id, business_code: businessCode };
        return res.status(200).json({ status:true, message: 'Business '+business_name+' Added successfully.', data : data });
        }
    } catch (error) {
        return res.status(200).json({ status:false, errors: validationErrors });
    }
});

router.get('/categories', async (req, res) => {
  try{
   
    const iscat = await Category.find({});
    if(iscat){
      return res.status(200).json({ status:true, message:'Categories', data : iscat });
    }
  } catch (error) {
    return res.status(200).json({ status:false, message:'error while fetching category' });
}
})

router.post('/addCategory', async (req, res) => {
  try{
    const { category_name } = req.body;
    const categoryCode = Helper.genRandomString();
    const newCat = new Category({
      category_name:category_name,
      category_code: categoryCode
    });
    const isave = await newCat.save();
    if(isave){
      return res.status(200).json({ status:true, message:'Category '+category_name+' added successfully' });
    }
  } catch (error) {
    return res.status(200).json({ status:false, message:'error while adding category' });
}
})

router.post('/updateCategory', async (req, res) => {
  try {

    const {business_code, category_code, no_of_entity,no_of_floors, description } = req.body;

    // Check for required fields
    if (!business_code || !category_code || !no_of_entity || !no_of_floors || !description) {
        return res.status(200).json({ status:false, message:'All required fields must be provided.', error: 'All required fields must be provided.' });
    }
   
    const hasCat = await Category.findOne({ category_code });
    if(!hasCat){
      return res.status(200).json({ status:false, message:'Invalid Category', error: 'Invalid Category' });
    }

    const existingBusi = await Business.findOne({ business_code });
      if (!existingBusi) {
        return res.status(200).json({ status:false, message:'Invalid Business Code', error: 'Invalid Business Code' });
      }

      const business = new BusinessCategory({
        category_code: category_code,
        business_code: business_code,
        no_of_entity: no_of_entity,
        no_of_floors: no_of_floors,
        description: description
    });

    // Save the business to the database
    const savedBusiness = await business.save();
    if (savedBusiness) {
      return res.status(200).json({ status:true, message:'Business Category Added with Business Code '+business_code });
      } else {
      return res.status(200).json({ status:false, message:'Category Not Updated' });  
      }
    
  } catch (error) {
      return res.status(200).json({ status:false, errors: validationErrors });
  }
});

router.post('/google_signup', async (req, res) => {
  try {
    const { email, google_id, google_name, google_image } = req.body;

    const existingUser = await User.findOne({ email: email,is_social: false });
    if (existingUser) {
      return res.status(200).json({ status:false, message:'Email already registered',error: 'Email already registered' });
    }

    // Find the user in the database
    const user = await User.findOne({ 
     is_social: true, 
     email: email
     });
    
    if(!user){
      const newUser = new User({
        email:email,
        userId:email,
        google_id:   google_id,
        social_name: google_name,
        social_image: google_image,
        is_social: true
      });
      const isave = await newUser.save();
    if (isave) {
      const jwtkey=process.env.JWT_SECRET
      const payload = {
        sub: email,
        iat: Math.floor(Date.now() / 1000),
      };
      let token=jwt.sign(payload,jwtkey,{
        expiresIn:"24h"
      })
      const data = { email: email, google_id:google_id, google_image: google_image, google_name: google_name, token: token };
      return res.status(200).json({ status:true, message: 'Google Signup Successful',data:data });
    } else {
      res.status(200).json({status:false, message:'Signup Error', error: 'Signup Error' });
    }
    } else if(user){
      // jwt Token
      const jwtkey=process.env.JWT_SECRET
                const payload = {
                  sub: email,
                  iat: Math.floor(Date.now() / 1000),
                };
                let token=jwt.sign(payload,jwtkey,{
                  expiresIn:"24h"
                })
                const data = { email: email, google_id:user.google_id, google_image: user.social_image, google_name: user.social_name, token: token };
                return res.status(200).json({ status:true, message: 'Login successful',data:data });
    }
  } catch (error) {
    res.status(200).json({ status:false, message:'Internal server error', error: error });
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

router.post("/forgot", async (req,res)=>{
  try {
    const { email } = req.body;
    
    console.log("email",email);
    // Validate email and password
    if (!email) {
      return res.status(200).json({ status:false, message:'Email is required', error: 'Email is required' });
    }

    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(200).json({ status:false, message:'Email is not registered',error: 'Email is not registered' });
    }

    const otapa = Helper.generateOTP();  
  
      const exisotp = await Forgot.findOne({ email });
      if(!exisotp){
      const newotp = new Forgot({
        email:email,
        otp: otapa
      });
      const issave = await newotp.save();
      if(issave){
        const emailResponse = await Helper.sendVerificationEmail(email, otapa);
        if (emailResponse.success) {
          return res.status(200).json({status:true, message: 'Forgot OTP sent to mail' });
        } else {
            console.error('Failed to send email:', emailResponse.message);
            return res.status(200).json({ status:false, message:'Something Went Wrong',error: 'Something Went Wrong' });
        }
      } else {
        return res.status(200).json({status:false, error: 'Something Went Wrong' });
      }
    } else {
      const result = await Forgot.updateOne({ email: email }, { $set: { otp: otapa, isVerified : false, expires_at : new Date(Date.now() + 5 * 60 * 1000) } });
      if (result.modifiedCount > 0) {
        const emailResponse = await Helper.sendVerificationEmail(email, otapa);
        if (emailResponse.success) {
          return res.status(200).json({status:true, message: 'Forgot OTP sent to mail' });
        } else {
            console.error('Failed to send email:', emailResponse.message);
            return res.status(200).json({ status:false, message:'Something Went Wrong',error: 'Something Went Wrong' });
        }
      } else {
        return res.status(200).json({status:false, error: 'Something Went Wrong' });
      }
    }
  
   
  } catch (error) {
    console.error(error);
    return res.status(200).json({status:false, message:'Internal Server Error', error: 'Internal server error' });
  }
})

router.post('/verify_forgot', async (req, res) => {
  try {
  const { email, otp } = req.body;

  if (!email || !otp) {
      return res.status(200).json({ status:false, message:'Email and OTP are required',error: 'Email and OTP are required' });
    }

  const OTPI = await Forgot.findOne({ email: email, otp: otp});
  if(!OTPI){
      return res.status(200).json({ status:false,error: 'Invalid OTP', message: 'Invalid OTP' });   
  } else if(OTPI){
    const expire = OTPI.expires_at;
    const dbExpireTime = new Date(expire);
    const currentTime = new Date();

if (dbExpireTime >= currentTime) {
  const result = await Forgot.updateOne({ email: email }, { $set: { isVerified : true } });
          if (result.modifiedCount > 0) {
  return res.status(200).json({ status:true, error: 'OTP Matched', message: 'OTP Matched' });
          } else {
            return res.status(200).json({ status:false, error: 'Internal Error', message: 'Internal Error' });
          }
  } else {
    return res.status(200).json({ status:false, error: 'OTP Expired', message: 'OTP Expired' });   
  }
  }
} 
catch (error) {
  console.log(error);
  return res.status(200).json({status:false, message:'Internal Server Error', error: 'Internal server error' });
}
})

router.post("/update_password", async (req,res)=>{
  try {
    const { email, password } = req.body;
    // Validate email and password
    if (!email) {
      return res.status(200).json({ status:false, message:'Email is required', error: 'Email is required' });
    }

    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(200).json({ status:false, message:'Email is not registered',error: 'Email is not registered' });
    } else {
      const OTPI = await Forgot.findOne({ email: email, isVerified : true});
      if(OTPI){
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await User.updateOne({ email: email }, { $set: { password: hashedPassword } });
          if (result.modifiedCount > 0) {
          return res.status(200).json({status:true, message:'Password Changed Successfully' });
          } else {
          return res.status(200).json({status:false, message:'Internal Server Error', error: 'Internal server error' });
          }
        } else {
          return res.status(200).json({status:false, message:'OTP not Verfied', error: 'OTP not Verfied' });
        } 
    }
  } catch (error) {
    console.error(error);
    return res.status(200).json({status:false, message:'Internal Server Error', error: 'Internal server error' });
  }
})

router.post('/findBusiness', async (req, res) => {
  try{
    const { business_code } = req.body;
    if (!business_code) {
      return res.status(200).json({ status:false, message:'Business Code is required',error: 'Business Code is required' });
    }
    const isbusi = await Business.findOne({ business_code : business_code });
    if(isbusi){
      return res.status(200).json({ status:true, message:'My Business', data : isbusi });
    } else {
      return res.status(200).json({ status:false, message:'No Business Found', data : isbusi });
    }
  } catch (error) {
    return res.status(200).json({ status:false, message:'error while fetching Business' });
}
})

router.post('/myBusiness', async (req, res) => {
  try{
    const { email } = req.body;
    if (!email) {
      return res.status(200).json({ status:false, message:'Email is required',error: 'Email is required' });
    }
    const isbusi = await Business.find({ user_id : email }).sort({ createdAt: -1 });
    if(isbusi){
      return res.status(200).json({ status:true, message:'My Business', data : isbusi });
    } else {
      return res.status(200).json({ status:false, message:'No Business Found', data : isbusi });
    }
  } catch (error) {
    return res.status(200).json({ status:false, message:'error while fetching category' });
}
})

router.post("/validate_save_pan", async(req,res)=>{
  try {
    const resp = await pan.validatePan(req,res);
    return resp
    } catch(error){
      console.log(error)
      return res.status(200).json({ status:false, message:error });
    }
})

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 200000, // Limit file size to 200 KB
  },
  fileFilter: (req, file, cb) => {
    const allowedFileTypes = /jpeg|jpg|png/;
    const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedFileTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      return res.status(200).json({ status: false, message: 'Invalid file type. Only JPEG, JPG, and PNG are allowed.' });
      //return cb(new Error('Invalid file type. Only JPEG, JPG, and PNG are allowed.'));
    }
  },
});

router.post("/validate_aadhaar", async(req,res)=>{
  try {
    const resp = await aadhaar.validateAadhaar(req,res);
    return resp
    } catch(error){ 
      console.log(error)
      return res.status(200).json({ status:false, message:error });
    }
  })

// Define the file upload route
router.post('/aadhar_front', upload.single('file'), async (req, res) => {
  try {
    const resp = await aadhaar.aadhaarOcrFront(req,res);
    return resp
    } catch(error){ 
      console.log(error)
      return res.status(200).json({ status:false, message:error });
    }
});

router.post('/aadhar_back', upload.single('file'), async (req, res) => {
  try {
    const resp = await aadhaar.aadhaarOcrBack(req,res);
    return resp
    } catch(error){ 
      console.log(error)
      return res.status(200).json({ status:false, message:error });
    }
});

router.post('/pan_ocr', upload.single('file'), async (req, res) => {
  try {
    const resp = await pan.panOcr(req,res);
    return resp
    } catch(error){ 
      console.log(error)
      return res.status(200).json({ status:false, message:error });
    }
});

router.post("/generate_otp", async(req,res)=>{
  try {
    const resp = await aadhaar.generateAadharOtp(req,res);
    return resp
    } catch(error){ 
      console.log(error)
      return res.status(200).json({ status:false, message:error });
    }
  })
 
router.post("/submit_otp", async(req,res)=>{
    try {
    const resp = await aadhaar.submitAadhaarOtp(req,res);
    return resp
    } catch(error){ 
      console.log(error)
      return res.status(200).json({ status:false, message:error });
    }
  })  

router.post("/voter_id", async(req,res)=>{
    try {
    const resp = await voter.votervalidation(req,res);
    return resp
    } catch(error){
      console.log(error)
      return res.status(200).json({ status:false, message:error });
    }
})  

router.post('/seeKyc', async (req, res) => {
  try{
    const { mobile } = req.body;
    if (!mobile) {
      return res.status(200).json({ status:false, message:'Mobile is required',error: 'Mobile is required' });
    }
    const isClient = await Client.findOne({ mobile : mobile });
    if(isClient){
      const dataObject = {
        pan_validation: isClient ? true : false,
        pan_ocr: isClient.pan_ocr != null ? true : false,
        aadhaar_validation: isClient.aadhaar_validation == true ? true : false,
        aadhaar_mobile_validation: isClient.aadhaar_verification == true ? true : false,
        aadhaar_front: isClient.aadhar_front != null ? true : false,
        aadhaar_back: isClient.aadhar_back != null ? true : false,
        voter_validation: isClient.voter_validation == true ? true : false,
        voter_ocr: isClient.voter_ocr != null ? true : false,
        license_validation: isClient.license_validation == true ? true : false,
        license_ocr: isClient.license_ocr != null ? true : false,
        passport_validation: isClient.passport_validation == true ? true : false,
        passport_ocr: isClient.passport_ocr != null ? true : false,
      };
      return res.status(200).json({ status:true, message:'KYC Status', data : dataObject });
    } else {
      const dataObject = {
        pan_validation: false,
        pan_ocr: false,
        aadhaar_validation: false,
        aadhaar_mobile_validation: false,
        aadhaar_front: false,
        aadhaar_back: false,
        voter_validation: false,
        voter_ocr: false,
        license_validation: false,
        license_ocr: false,
        passport_validation: false,
        passport_ocr: false,
      };
      return res.status(200).json({ status:false, message:'No Client Found', data : dataObject });
    }
  } catch (error) {
    return res.status(200).json({ status:false, message:'error while fetching Client' });
}
})

router.post('/getName', async (req, res) => {
  try{
    const { mobile } = req.body;
    if (!mobile) {
      return res.status(200).json({ status:false, message:'Mobile is required',error: 'Mobile is required' });
    }
    const isClient = await Pan.findOne({ mobile : mobile });
    if(isClient){
      const dataObject = {
        full_name: isClient.full_name,
      };
      return res.status(200).json({ status:true, message:'User Details', data : dataObject });
    }
  } catch (error) {
    return res.status(200).json({ status:false, message:'error while fetching Client' });
}
})

router.post('/delKyc', async (req, res) => {
// Perform a left outer join between clients and pans collections
    db.clients.aggregate([
      {
        $lookup: {
          from: "pans",
          localField: "mobile",
          foreignField: "mobile",
          as: "panMatches"
        }
      },
      // Perform a left outer join between clients and aadhars collections
      {
        $lookup: {
          from: "aadhars",
          localField: "mobile",
          foreignField: "mobile",
          as: "aadharMatches"
        }
      },
      // Merge the matched documents from clients into pans
      {
        $merge: {
          into: "pans",
          whenMatched: "merge"
        }
      },
      // Merge the matched documents from clients into aadhars
      {
        $merge: {
          into: "aadhars",
          whenMatched: "merge"
        }
      },
      // Remove the clients documents
      {
        $unset: "clients"
      }
    ]);

})

module.exports = router;