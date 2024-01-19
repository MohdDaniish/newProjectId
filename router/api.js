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
  const { pan, mobile } = req.body;
  if (!pan || !mobile) {
    return res.status(200).json({ status:false, message:'PAN and Mobile number is required', error: 'PAN and Mobile number is required' });
  }

  if (Helper.validatePanNumber(pan)) {
    
  const is_pan = await Client.findOne({ pan_number: pan});

  if(is_pan){
    const pan_detail = is_pan;
    console.log("Saved Record");
    return res.status(200).json({ status:true, message:'Pan Validated', data : pan_detail });
  }
    const apiUrl = "https://sandbox.surepass.io/api/v1/pan/pan-comprehensive";
      
    // Data to be sent in the request body
    const postData = {
      id_number: pan,
    };

    // Options for the fetch request
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTcwNDkwNjYxNCwianRpIjoiMDljYzMzMzMtY2ZhNS00ZGI5LWIwMjktZDMxYzMxODQ1MTQ1IiwidHlwZSI6ImFjY2VzcyIsImlkZW50aXR5IjoiZGV2Lm5hZGNhYkBzdXJlcGFzcy5pbyIsIm5iZiI6MTcwNDkwNjYxNCwiZXhwIjoxNzA3NDk4NjE0LCJ1c2VyX2NsYWltcyI6eyJzY29wZXMiOlsidXNlciJdfX0.9LPdnXNmlg8VeMI8c8iiagF_BfWMZk8-Vb1gUSMNc4s", // Replace with your actual access token
      },
      body: JSON.stringify(postData),
    };

    // Make the POST request
    const response = await fetch(apiUrl, options);
    const dataset = await response.json();

    if (dataset) {
      const data = dataset;
        console.log(dataset,'datatatat');
        const fulnamesplit = data.data.full_name_split;

        // Convert the array to a string
        const split_name = fulnamesplit.join(' ');

        console.log(split_name);
        console.log('data', data.data.aadhaar_linked);
        const cli = new Client({
          aadhaar_linked: data.data.aadhaar_linked,
          city: data.data.address.city,
          country :data.data.address.country,
          full : data.data.address.full,
          line_1 : data.data.address.line_1,
          line_2 : data.data.address.line_2,
          state : data.data.address.state,
          street_name : data.data.address.street_name,
          zip : data.data.address.zip,
          client_id:data.data.client_id,
          dob:data.data.dob,
          pan_number:data.data.pan_number,
          category : data.data.category,
          dob_check : data.data.dob_check,
          dob_verified : data.data.dob_verified,
          email: data.data.email,
          full_name : data.data.full_name,
          full_name_split : split_name,
          gender : data.data.gender,
          input_dob : data.data.input_dob,
          less_info : data.data.less_info,
          masked_aadhaar : data.data.masked_aadhaar,
          phone_number : data.data.phone_number,
          mobile : mobile
        });

        // Save the business to the database
        const saved = await cli.save();
        if(saved){
          const is_pan = await Client.findOne({ pan_number: pan});
        if(is_pan){
          const pan_detail = is_pan;
          return res.status(200).json({ status:true, message:'Pan Validated', data : pan_detail });
        } else {
          return res.status(200).json({ status:false, message:'Error while Validating PAN details', data : '' });
        }
        } else {
          return res.status(200).json({ status:true, message:'PAN data saved' });
        }

    } else {
      return res.status(200).json({ status:false, message:'Error while fetching PAN details', data : 'Invalid PAN' });
    }
  
  } else {
    return res.status(200).json({ status:false, message:`${pan} is not a valid PAN number.`});
    console.log(`${pan} is not a valid PAN number.`);
  }

  
} catch(error){
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
    const { aadhar, mobile } = req.body;
    if (!aadhar || !mobile) {
      return res.status(200).json({ status:false, message:'Aadhar Number and Mobile number is required' });
    }
  
    if (Helper.isValidAadharNumber(aadhar)) {
      
    const is_pan = await Client.findOne({ mobile: mobile});

    if(!is_pan){
      return res.status(200).json({ status:false, message:'Pan Verification is Pending Or User Not Exist' }); 
    }

    const is_aadh = await Client.findOne({ aadhaar_validation: true, mobile: mobile});
    
    if(is_aadh){
      const _detail = is_aadh;
      console.log("Saved Record");
      return res.status(200).json({ status:true, message:'Aadhar Already Validated', data : _detail });
    }
    
    const maskedAdhar = is_pan.masked_aadhaar;
   
    const lastFourDigitsSubstring = maskedAdhar.substring(maskedAdhar.length - 4);
    const lastFourDigitsSlice = maskedAdhar.slice(-4);

    const givenDigitsSubstring = aadhar.substring(aadhar.length - 4);
    console.log("Given Aadhar FOur",givenDigitsSubstring);
    console.log("Saved Aadhar FOur",lastFourDigitsSubstring);

    if(lastFourDigitsSubstring != givenDigitsSubstring){
      return res.status(200).json({ status:false, message:'Your Aadhar Not Match with PAN details' }); 
    }

      const apiUrl = "https://sandbox.surepass.io/api/v1/aadhaar-validation/aadhaar-validation";
        
      // Data to be sent in the request body
      const postData = {
        id_number: aadhar,
      };
  
      // Options for the fetch request
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTcwNDkwNjYxNCwianRpIjoiMDljYzMzMzMtY2ZhNS00ZGI5LWIwMjktZDMxYzMxODQ1MTQ1IiwidHlwZSI6ImFjY2VzcyIsImlkZW50aXR5IjoiZGV2Lm5hZGNhYkBzdXJlcGFzcy5pbyIsIm5iZiI6MTcwNDkwNjYxNCwiZXhwIjoxNzA3NDk4NjE0LCJ1c2VyX2NsYWltcyI6eyJzY29wZXMiOlsidXNlciJdfX0.9LPdnXNmlg8VeMI8c8iiagF_BfWMZk8-Vb1gUSMNc4s", // Replace with your actual access token
        },
        body: JSON.stringify(postData),
      };
  
      // Make the POST request
      const response = await fetch(apiUrl, options);
      const dataset = await response.json();
  
      if (dataset) {
        const data = dataset;
          console.log(dataset,'datatatat');
  
          const result = await Client.updateOne({ mobile: mobile }, { $set: {
            aadhaar_number: data.data.aadhaar_number,
            aadhaar_validation : true
            } });
          if (result.modifiedCount > 0) {
            const is_aadha = await Client.findOne({ mobile: mobile});
          if(is_aadha){
            const _details = is_aadha;
            return res.status(200).json({ status:true, message:'Aadhaar Validated', data : _details });
          } else {
            return res.status(200).json({ status:false, message:'Error while Validating Aadhaar details', data : '' });
          }
          } else {
            return res.status(200).json({ status:true, message:'Aadhaar data saved' });
          }
  
      } else {
        return res.status(200).json({ status:false, message:'Error while fetching Aadhaar details', data : '' });
      }
    
    } else {
      console.log(`${aadhar} is not a valid Aadhaar number.`);
      return res.status(200).json({ status:false, message:`${aadhar} is not a valid Aadhaar number.` });
      
    }
  } catch(error){
    console.log(error)
    return res.status(200).json({ status:false, message:error });
  }
  })

// Define the file upload route
router.post('/aadhar_front', upload.single('image'), async (req, res) => {
  try {
    var { mobile } = req.body;
    mobile = parseInt(mobile);
    if (!mobile) {
      return res.status(200).json({ status:false, message:'Mobile Number is required', error: 'Mobile Number is required' });
    }

    if (!req.file) {
      return res.status(200).json({ status: false, message: 'No file uploaded.' });
      throw new Error('No file uploaded.');
    }

    const dimensions = sizeOf(req.file.buffer);

    // const maxWidth = 1300;
    // const maxHeight = 1000;
    // if (dimensions.width > maxWidth || dimensions.height > maxHeight) {
    //   throw new Error('Image dimensions exceed the allowed size.');
    // }
    console.log("mobile",mobile);
    const panExist = await Client.findOne({ mobile : mobile });
    if (!panExist) {
      return res.status(200).json({ status:false, message:'User Not Exist or PAN number not updated'});
    }

    if (panExist.aadhar_front != null) {
      return res.status(200).json({ status:true, message:'Aadhar Front Already Uploaded And Validated'});
    }
    
    const maskedAdhar = panExist.masked_aadhaar;
    const savedDOB = panExist.dob;
    console.log(maskedAdhar);
   
    const lastFourDigitsSubstring = maskedAdhar.substring(maskedAdhar.length - 4);
    const lastFourDigitsSlice = maskedAdhar.slice(-4);

// console.log("Last four digits (substring):", lastFourDigitsSubstring);
// console.log("Last four digits (slice):", lastFourDigitsSlice);

    if(maskedAdhar == null || maskedAdhar == ""){
      return res.status(200).json({ status:false, message:'PAN details not updated'});
    }
    
    // uploading aadhar image
    var randomUid = Helper.generateRandomUid(50);
    const extension = path.extname(req.file.originalname).toLowerCase();
    randomUid = randomUid+extension;
    const uploadPath = path.join(__dirname, '../public/uploads/aadhaar/front', randomUid);
    require('fs').writeFileSync(uploadPath, req.file.buffer);

      console.log("file_name",req.file.originalname);
     
      const filePath = path.join(__dirname, '/../public', 'uploads/aadhaar/front', randomUid);
      const axios = require('axios');
      const FormData = require('form-data');
      const fs = require('fs');
      let data = new FormData();
      data.append('file', fs.createReadStream(filePath));
      
      let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://sandbox.surepass.io/api/v1/ocr/aadhaar',
        headers: { 
          'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTcwNDkwNjYxNCwianRpIjoiMDljYzMzMzMtY2ZhNS00ZGI5LWIwMjktZDMxYzMxODQ1MTQ1IiwidHlwZSI6ImFjY2VzcyIsImlkZW50aXR5IjoiZGV2Lm5hZGNhYkBzdXJlcGFzcy5pbyIsIm5iZiI6MTcwNDkwNjYxNCwiZXhwIjoxNzA3NDk4NjE0LCJ1c2VyX2NsYWltcyI6eyJzY29wZXMiOlsidXNlciJdfX0.9LPdnXNmlg8VeMI8c8iiagF_BfWMZk8-Vb1gUSMNc4s', 
          ...data.getHeaders()
        },
        data : data
      };
      
      axios.request(config)
      .then(async (response) => {
        const data = response.data;
        console.log("response data",data);
       
        const document_type = data.data.ocr_fields[0].document_type;
        if(document_type == "aadhaar_front_bottom"){
        const aadhar_number = data.data.ocr_fields[0].aadhaar_number.value;
        const dob = data.data.ocr_fields[0].dob.value;
        console.log("aadhar_number",data.data.ocr_fields[0].aadhaar_number.value);
        if(aadhar_number.length == 12){
        const savedFourDigitsSubstring = aadhar_number.substring(aadhar_number.length - 4);
        const savedFourDigitsSlice = aadhar_number.slice(-4);
        console.log("saved aadhar",savedFourDigitsSubstring);
        console.log("api aadhar",lastFourDigitsSubstring);
        console.log("saved dob",savedDOB);
        console.log("api dob",dob);
        if(savedFourDigitsSubstring == lastFourDigitsSubstring && dob == savedDOB){
          console.log("RESPONSE : AADHAR MATCH FRONT");
          // updated image name in client aadhar
          const result = await Client.updateOne({ mobile: mobile }, { $set: { aadhar_front: randomUid } });
          if (result.modifiedCount > 0) {
          res.status(200).json({ status: true, message: 'Aadhar Front Validated' });
          } else {
          res.status(200).json({ status: false, message: 'Error While Validating Aadhar Front' });  
          }
        } else {
          // delete uploaded image
          console.log("RESPONSE : AADHAR FRONT DATA DO NOT MATCHED");
          const imagePath = path.join(__dirname, '../public/uploads/aadhaar/front',randomUid );
          console.log(imagePath);
          Helper.deleteFileWithRetry(imagePath);
          res.status(200).json({ status: false, message: 'Aadhar Front Data not Matched' });
        }
        } else {
          console.log("RESPONSE : AADHAR FRONT DATA DO NOT MATCHED");
          const imagePath = path.join(__dirname, '../public/uploads/aadhaar/front',randomUid );
          Helper.deleteFileWithRetry(imagePath);
          res.status(200).json({ status: false, message: 'Aadhar Front Data not Matched' });
        }
      } else {
        console.log("RESPONSE : Invalid Aadhar Front");
        const imagePath = path.join(__dirname, '../public/uploads/aadhaar/front',randomUid );
        console.log(imagePath);
        Helper.deleteFileWithRetry(imagePath);
      }

      })
      .catch((error) => {
        res.status(200).json({ status: false, message: 'Invalid Aadhar Front Image' });
      });
  
  } catch (error) {
    res.status(200).json({ status: false, message: 'Invalid Aadhar Front Image' });
  }
});

router.post('/aadhar_back', upload.single('image'), async (req, res) => {
  try {
    var { mobile } = req.body;
    mobile = parseInt(mobile);
    if (!mobile) {
      return res.status(200).json({ status:false, message:'Mobile Number is required', error: 'Mobile Number is required' });
    }

    if (!req.file) {
      return res.status(200).json({ status: false, message: 'No file uploaded.' });
      throw new Error('No file uploaded.');
    }

    const dimensions = sizeOf(req.file.buffer);

    // const maxWidth = 1300;
    // const maxHeight = 1000;
    // if (dimensions.width > maxWidth || dimensions.height > maxHeight) {
    //   throw new Error('Image dimensions exceed the allowed size.');
    // }
    console.log("mobile",mobile);
    const panExist = await Client.findOne({ mobile : mobile });
    if (!panExist) {
      return res.status(200).json({ status:false, message:'User Not Exist or PAN number not updated'});
    }

    if (panExist.aadhar_back != null) {
      return res.status(200).json({ status:true, message:'Aadhar Back Already Uploaded And Validated'});
    }
    
    const maskedAdhar = panExist.masked_aadhaar;
    const savedDOB = panExist.dob;
    console.log(maskedAdhar);
   
    const lastFourDigitsSubstring = maskedAdhar.substring(maskedAdhar.length - 4);
    const lastFourDigitsSlice = maskedAdhar.slice(-4);

// console.log("Last four digits (substring):", lastFourDigitsSubstring);
// console.log("Last four digits (slice):", lastFourDigitsSlice);

    if(maskedAdhar == null || maskedAdhar == ""){
      return res.status(200).json({ status:false, message:'PAN details not updated'});
    }
    
    // uploading aadhar image
    var randomUid = Helper.generateRandomUid(50);
    const extension = path.extname(req.file.originalname).toLowerCase();
    randomUid = randomUid+extension;
    const uploadPath = path.join(__dirname, '../public/uploads/aadhaar/back', randomUid);
    require('fs').writeFileSync(uploadPath, req.file.buffer);

      console.log("file_name",req.file.originalname);
     
      const filePath = path.join(__dirname, '/../public', 'uploads/aadhaar/back', randomUid);
      const axios = require('axios');
      const FormData = require('form-data');
      const fs = require('fs');
      let data = new FormData();
      data.append('file', fs.createReadStream(filePath));
      
      let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://sandbox.surepass.io/api/v1/ocr/aadhaar',
        headers: { 
          'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTcwNDkwNjYxNCwianRpIjoiMDljYzMzMzMtY2ZhNS00ZGI5LWIwMjktZDMxYzMxODQ1MTQ1IiwidHlwZSI6ImFjY2VzcyIsImlkZW50aXR5IjoiZGV2Lm5hZGNhYkBzdXJlcGFzcy5pbyIsIm5iZiI6MTcwNDkwNjYxNCwiZXhwIjoxNzA3NDk4NjE0LCJ1c2VyX2NsYWltcyI6eyJzY29wZXMiOlsidXNlciJdfX0.9LPdnXNmlg8VeMI8c8iiagF_BfWMZk8-Vb1gUSMNc4s', 
          ...data.getHeaders()
        },
        data : data
      };
      
      axios.request(config)
      .then(async (response) => {
        const data = response.data;
        console.log("response data",data);
        
        const document_type = data.data.ocr_fields[0].document_type;
        if(document_type == "aadhaar_back"){
        const aadhar_number = data.data.ocr_fields[0].aadhaar_number.value;
        console.log("aadhar_number",data.data.ocr_fields[0].aadhaar_number.value);
        if(aadhar_number.length == 12){
        const savedFourDigitsSubstring = aadhar_number.substring(aadhar_number.length - 4);
        const savedFourDigitsSlice = aadhar_number.slice(-4);
        console.log("saved aadhar",savedFourDigitsSubstring);
        console.log("api aadhar",lastFourDigitsSubstring);
        console.log("saved dob",savedDOB);
        
        if(savedFourDigitsSubstring == lastFourDigitsSubstring){
          console.log("RESPONSE : AADHAR MATCH BACK");
          // updated image name in client aadhar
          const result = await Client.updateOne({ mobile: mobile }, { $set: { aadhar_back: randomUid } });
          if (result.modifiedCount > 0) {
          res.status(200).json({ status: true, message: 'Aadhar Back Validated' });
          } else {
          res.status(200).json({ status: false, message: 'Error While Validating Aadhar Back' });  
          }
        } else {
          // delete uploaded image
          const imagePath = path.join(__dirname, '../public/uploads/aadhaar/back',randomUid );
          Helper.deleteFileWithRetry(imagePath);
          console.log("RESPONSE : AADHAR BACK DATA DO NOT MATCHED");
          res.status(200).json({ status: false, message: 'Aadhar Back Data not Matched' });
        }
        } else {
          const imagePath = path.join(__dirname, '../public/uploads/aadhaar/back',randomUid );
          Helper.deleteFileWithRetry(imagePath);
          console.log("RESPONSE : AADHAR BACK DATA DO NOT MATCHED");
          res.status(200).json({ status: false, message: 'Aadhar Back Data not Matched' });
        }
      } else {
        console.log("RESPONSE : Invalid Aadhar Back");
        const imagePath = path.join(__dirname, '../public/uploads/aadhaar/back',randomUid );
        console.log(imagePath);
        Helper.deleteFileWithRetry(imagePath);
      }

      })
      .catch((error) => {
        res.status(200).json({ status: false, message: 'Invalid Aadhar Back Image' });
      });
  
  } catch (error) {
    res.status(200).json({ status: false, message: 'Invalid Aadhar Back Image' });
  }
});

router.post('/pan_ocr', upload.single('image'), async (req, res) => {
  try {
    var { mobile } = req.body;
    mobile = parseInt(mobile);
    if (!mobile) {
      return res.status(200).json({ status:false, message:'Mobile Number is required', error: 'Mobile Number is required' });
    }

    if (!req.file) {
      return res.status(200).json({ status: false, message: 'No file uploaded.' });
      throw new Error('No file uploaded.');
    }

    const dimensions = sizeOf(req.file.buffer);

    // const maxWidth = 1300;
    // const maxHeight = 1000;
    // if (dimensions.width > maxWidth || dimensions.height > maxHeight) {
    //   throw new Error('Image dimensions exceed the allowed size.');
    // }
    console.log("mobile",mobile);
    const panExist = await Client.findOne({ mobile : mobile });
    if (!panExist) {
      return res.status(200).json({ status:false, message:'User Not Exist or PAN number not updated'});
    }

    if (panExist.pan_ocr != null) {
      return res.status(200).json({ status:true, message:'PAN Already Uploaded And Validated'});
    }
    
    const savedfullname = panExist.full_name;
    const savedDOB = panExist.dob;
    const savedpan = panExist.pan_number;
    
    // uploading aadhar image
    var randomUid = Helper.generateRandomUid(50);
    const extension = path.extname(req.file.originalname).toLowerCase();
    randomUid = randomUid+extension;
    const uploadPath = path.join(__dirname, '../public/uploads/pan', randomUid);
    require('fs').writeFileSync(uploadPath, req.file.buffer);

      console.log("file_name",req.file.originalname);
     
      const filePath = path.join(__dirname, '/../public', 'uploads/pan', randomUid);
      const axios = require('axios');
      const FormData = require('form-data');
      const fs = require('fs');
      let data = new FormData();
      data.append('file', fs.createReadStream(filePath));
      
      let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://sandbox.surepass.io/api/v1/ocr/pan',
        headers: { 
          'Authorization': 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTcwNDkwNjYxNCwianRpIjoiMDljYzMzMzMtY2ZhNS00ZGI5LWIwMjktZDMxYzMxODQ1MTQ1IiwidHlwZSI6ImFjY2VzcyIsImlkZW50aXR5IjoiZGV2Lm5hZGNhYkBzdXJlcGFzcy5pbyIsIm5iZiI6MTcwNDkwNjYxNCwiZXhwIjoxNzA3NDk4NjE0LCJ1c2VyX2NsYWltcyI6eyJzY29wZXMiOlsidXNlciJdfX0.9LPdnXNmlg8VeMI8c8iiagF_BfWMZk8-Vb1gUSMNc4s', 
          ...data.getHeaders()
        },
        data : data
      };
      
      axios.request(config)
      .then(async (response) => {
        const data = response.data;
        console.log("response data",data);
        
        const document_type = data.data.ocr_fields[0].document_type;
        if(document_type == "pan"){
        const pan_number = data.data.ocr_fields[0].pan_number.value;
        console.log("pan",pan_number);
        const pan_full_name = data.data.ocr_fields[0].full_name.value;
        const dob = data.data.ocr_fields[0].dob.value;

        // changing date format to 1990-01-01
        const dateString = dob;
        const parts = dateString.split('/');
        const year = parts[2];
        const month = parts[0];
        const day = parts[1];
        const pan_dob = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

        if(savedfullname == pan_full_name && pan_number == savedpan && savedDOB == pan_dob){
        
          console.log("RESPONSE : PAN Image is Valid");
          // updated image name in client aadhar
          const result = await Client.updateOne({ mobile: mobile }, { $set: { pan_ocr: randomUid } });
          if (result.modifiedCount > 0) {
          res.status(200).json({ status: true, message: 'PAN Image is Valid' });
          } else {
          res.status(200).json({ status: false, message: 'Error While Validating PAN ' });  
          }
        } else {
          // delete uploaded image
          const imagePath = path.join(__dirname, '../public/uploads/pan',randomUid );
          console.log(imagePath);
          Helper.deleteFileWithRetry(imagePath);
          console.log("RESPONSE : PAN DATA DO NOT MATCHED");
          res.status(200).json({ status: false, message: 'PAN Data not Matched' });
        }
       
      } else {
        console.log("RESPONSE : Invalid PAN image");
        const imagePath = path.join(__dirname, '../public/uploads/pan',randomUid );
        console.log(imagePath);
        Helper.deleteFileWithRetry(imagePath);
      }

      })
      .catch((error) => {
        console.log(error)
        res.status(200).json({ status: false, message: 'Invalid PAN Image' });
      });
  
  } catch (error) {
    console.log(error)
    res.status(200).json({ status: false, message: 'Invalid PAN Image' });
  }
});

router.post("/generate_otp", async(req,res)=>{
  try {
    const { mobile, aadhar } = req.body;
    if (!mobile || !aadhar) {
      return res.status(200).json({ status:false, message:'Aadhar Number and Mobile number is required' });
    }
  
    if (Helper.isValidAadharNumber(aadhar)) {
      
      const is_pan = await Client.findOne({ mobile: mobile});

      if(!is_pan){
        return res.status(200).json({ status:false, message:'Pan Verification is Pending Or User Not Exist' }); 
      }
  
      const is_aadh = await Client.findOne({ aadhaar_validation: true, mobile: mobile});
      
      if(!is_aadh){
        return res.status(200).json({ status:false, message:'Aadhar Validation is not complete' });
      }
    const savedAdhar = is_pan.aadhaar_number;

    if(savedAdhar != aadhar){
      return res.status(200).json({ status:false, message:'Aadhar Not Matched with our record' });
    }
 

      const apiUrl = "https://sandbox.surepass.io/api/v1/aadhaar-v2/generate-otp";
        
      // Data to be sent in the request body
      const postData = {
        id_number: aadhar,
      };
  
      // Options for the fetch request
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTcwNDkwNjYxNCwianRpIjoiMDljYzMzMzMtY2ZhNS00ZGI5LWIwMjktZDMxYzMxODQ1MTQ1IiwidHlwZSI6ImFjY2VzcyIsImlkZW50aXR5IjoiZGV2Lm5hZGNhYkBzdXJlcGFzcy5pbyIsIm5iZiI6MTcwNDkwNjYxNCwiZXhwIjoxNzA3NDk4NjE0LCJ1c2VyX2NsYWltcyI6eyJzY29wZXMiOlsidXNlciJdfX0.9LPdnXNmlg8VeMI8c8iiagF_BfWMZk8-Vb1gUSMNc4s", // Replace with your actual access token
        },
        body: JSON.stringify(postData),
      };
  
      // Make the POST request
      const response = await fetch(apiUrl, options);
      const dataset = await response.json();
  
      if (dataset) {
        const data = dataset;
          console.log(dataset,'datatatat');
          if(data.data.otp_sent == true && data.data.status == "generate_otp_success"){
            const result = await Client.updateOne({ mobile: mobile,aadhaar_number:aadhar }, { $set: {
              aadhaar_client_id: data.data.client_id
              } });
            if (result.modifiedCount > 0) {
            return res.status(200).json({ status:true, message: 'Aadhaar OTP sent to your Mobile', data : data.data.client_id });
            }
          }
      } else {
        return res.status(200).json({ status:false, message:'Error while Generating Aadhaar OTP' });
      }
    
    } else {
      console.log(`${aadhar} is not a valid Aadhaar number.`);
      return res.status(200).json({ status:false, message:`${aadhar} is not a valid Aadhaar number.` });
      
    }
  } catch(error){
    console.log(error)
    return res.status(200).json({ status:false, message:error });
  }
  })
 
  router.post("/submit_otp", async(req,res)=>{
    try {
      const { client_id, otp } = req.body;
      if (!client_id || !otp) {
        return res.status(200).json({ status:false, message:'Client Id and OTP is required' });
      }

      const checkk = await Client.findOne({ aadhaar_client_id: client_id, aadhaar_verification : true});
      if(checkk){
      return res.status(200).json({ status:true, message:'Aadhaar OTP Validation Already Completed', data : checkk });  
      }
    
      if (typeof otp === 'number' && otp.length == 6) {
        const is_pan = await Client.findOne({ aadhaar_client_id: client_id});
  
        if(!is_pan){
          return res.status(200).json({ status:false, message:'Invalid Client Id' }); 
        }
      
        const apiUrl = "https://sandbox.surepass.io/api/v1/aadhaar-v2/submit-otp";
        // Data to be sent in the request body
        const postData = {
          client_id: client_id,
          otp : otp
        };
    
        // Options for the fetch request
        const options = {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTcwNDkwNjYxNCwianRpIjoiMDljYzMzMzMtY2ZhNS00ZGI5LWIwMjktZDMxYzMxODQ1MTQ1IiwidHlwZSI6ImFjY2VzcyIsImlkZW50aXR5IjoiZGV2Lm5hZGNhYkBzdXJlcGFzcy5pbyIsIm5iZiI6MTcwNDkwNjYxNCwiZXhwIjoxNzA3NDk4NjE0LCJ1c2VyX2NsYWltcyI6eyJzY29wZXMiOlsidXNlciJdfX0.9LPdnXNmlg8VeMI8c8iiagF_BfWMZk8-Vb1gUSMNc4s", // Replace with your actual access token
          },
          body: JSON.stringify(postData),
        };
    
        // Make the POST request
        const response = await fetch(apiUrl, options);
        const dataset = await response.json();
    
        if (dataset) {
          const data = dataset;
            console.log(dataset,'datatatat');
            if(data.data.message_code == "success" && data.data.success == true){
              const cli = new Aadhar({
                client_id: data.data.client_id,
                full_name :data.data.full_name,
                aadhaar_number : data.data.aadhaar_number,
                dob : data.data.dob,
                gender : data.data.gender,
                country : data.data.address.country,
                dist : data.data.address.street_name,
                state : data.data.address.state,
                po : data.data.address.po,
                loc : data.data.address.loc,
                vtc : data.data.address.vtc,
                subdist : data.data.address.subdist,
                street : data.data.address.street,
                house : data.data.address.house,
                landmark : data.data.address.landmark,
                face_status:data.data.face_status,
                face_score:data.data.face_score,
                zip:data.data.zip,
                profile_image : data.data.profile_image,
                has_image : data.data.has_image,
                raw_xml : data.data.raw_xml,
                zip_data: data.data.zip_data,
                care_of : data.data.care_of,
                uniqueness_id : data.data.uniqueness_id
              });
              // Save the business to the database
              const saved = await cli.save();
              if(saved){
                const result = await Client.updateOne({ aadhaar_client_id:client_id }, { $set: {
                  aadhaar_verification: true
                  } });
                if (result.modifiedCount > 0) {
              return res.status(200).json({ status:true, message:'Aadhar OTP Validation Success', data : data }); 
                }
              }
            } else {
              return res.status(200).json({ status:false, message:'Error while Verifying OTP', data : data });
            }
        } else {
          return res.status(200).json({ status:false, message:'Error while Generating Aadhaar OTP' });
        }
      
      } else {
        console.log(`${otp} is not a valid number.`);
        return res.status(200).json({ status:false, message:`${otp} is not a valid number.` });
      }
    } catch(error){
      console.log(error)
      return res.status(200).json({ status:false, message:error });
    }
    })  
module.exports = router;