const Helper = require('../helper/function');
const Client = require('../models/client.js');
const sizeOf = require('image-size');
const path = require('path');

async function validateAadhaar(req, res){
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
    } catch {
        console.log(error);
        return error;
    }
}

async function aadhaarOcrFront(req, res){
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

    } catch(error) {
        console.log(error);
        return error;
    }
}

async function aadhaarOcrBack(req, res){
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

    } catch {
        console.log(error);
        return error;
    }
}

async function generateAadharOtp(req, res){
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
    } catch(error) {
        return error;
    }
}

async function submitAadhaarOtp(req, res){
    try {
        const { client_id, otp } = req.body;
        if (!client_id || !otp) {
          return res.status(200).json({ status:false, message:'Client Id and OTP is required' });
        }
  
        const checkk = await Client.findOne({ aadhaar_client_id: client_id, aadhaar_verification : true});
        if(checkk){
        return res.status(200).json({ status:true, message:'Aadhaar OTP Validation Already Completed', data : checkk });  
        }
      
        if (typeof otp === 'number' && otp.toString().length == 6) {
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
                  mobile:is_pan.mobile,
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
    } catch(error) {
        return error;
    }
}

module.exports = {
    validateAadhaar:validateAadhaar,
    aadhaarOcrFront:aadhaarOcrFront,
    aadhaarOcrBack:aadhaarOcrBack,
    generateAadharOtp:generateAadharOtp,
    submitAadhaarOtp:submitAadhaarOtp
  }