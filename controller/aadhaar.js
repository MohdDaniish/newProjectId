const Helper = require('../helper/function');
const Client = require('../models/client.js');
const Aadhar = require('../models/aadhaar_detail.js');
const sizeOf = require('image-size');
const path = require('path');
const Pan = require('../models/pan.js');

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
          const _detail = await Aadhar.findOne({ mobile: mobile});;
          console.log("Aadhar Already Validated");
          return res.status(200).json({ status:false, message:'Aadhar Already Validated', data : _detail });
        }
        
        const adharData = await Pan.findOne({ mobile: mobile});;
        const maskedAdhar = adharData.masked_aadhaar;
        const lastFourDigitsSubstring = maskedAdhar.substring(maskedAdhar.length - 4);
        
    
        const givenDigitsSubstring = aadhar.substring(aadhar.length - 4);
        console.log("Given Aadhar FOur",givenDigitsSubstring);
        console.log("Saved Aadhar FOur",lastFourDigitsSubstring);
    
        if(lastFourDigitsSubstring != givenDigitsSubstring){
          return res.status(200).json({ status:false, message:'Your Aadhar Not Match with PAN details' }); 
        }
    
        const axios = require('axios');
        let data = JSON.stringify({
          "id_number": aadhar
        });
        
        let config = {
          method: 'post',
          maxBodyLength: Infinity,
          url: process.env.APIURL+'/api/v1/aadhaar-validation/aadhaar-validation',
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': 'Bearer '+process.env.TOKEN
          },
          data : data
        };
          // Make the POST request
          axios.request(config)
          .then(async (response) => {
            const data = response.data;
          
              console.log(data,'datatatat');
      
              const result = await Client.updateOne({ mobile: mobile }, { $set: {
                aadhaar_number: data.data.aadhaar_number,
                aadhaar_validation : true
                } });
              if (result.modifiedCount > 0) {
                // const is_aadha = await Client.findOne({ mobile: mobile});
              // if(is_aadha){
              //   const _details = is_aadha;
                return res.status(200).json({ status:true, message:'Aadhaar Validation Successfull', data : '' });
              } else {
                return res.status(200).json({ status:false, message:'Error while Validating Aadhaar details', data : '' });
              }
              // } else {
              //   return res.status(200).json({ status:true, message:'Aadhaar data saved' });
              // }
      
          }).catch((error) => {
            console.log(error)
            return res.status(200).json({ status:false, message:'Error while fetching Aadhaar details', data : '' });
          })
        
        } else {
          console.log(`${aadhar} is not a valid Aadhaar number.`);
          return res.status(200).json({ status:false, message:`${aadhar} is not a valid Aadhaar number.` });
          
        }
    } catch(error) {
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
        }
    
        const panExist = await Client.findOne({ mobile : mobile });
        if (!panExist) {
          return res.status(200).json({ status:false, message:'User Not Exist or PAN number not updated'});
        }

        const aadhVal = await Client.findOne({ mobile : mobile, aadhaar_validation : true });
        if (!aadhVal) {
          return res.status(200).json({ status:false, message:'Please Validate Your Aadhar First'});
        }
    
        if (panExist.aadhar_front != null) {
          return res.status(200).json({ status:false, message:'Aadhar Front Already Uploaded And Validated'});
        }
        
        const panData = await Pan.findOne({ mobile : mobile });
        const maskedAdhar = panData.masked_aadhaar;
        const savedDOB = panData.dob;
        const saveFullName = panData.full_name;
        const lastFourDigitsSubstring = maskedAdhar.substring(maskedAdhar.length - 4);
 
        if(maskedAdhar == null || maskedAdhar == ""){
          return res.status(200).json({ status:false, message:'PAN details not updated'});
        }
        
        // uploading aadhar image
        var randomUid = Helper.generateRandomUid(50);
        const extension = path.extname(req.file.originalname).toLowerCase();
        randomUid = randomUid+extension;
        const uploadPath = path.join(__dirname, '../public/uploads/aadhaar/front', randomUid);
        require('fs').writeFileSync(uploadPath, req.file.buffer);
    
          const filePath = path.join(__dirname, '/../public', 'uploads/aadhaar/front', randomUid);
          const axios = require('axios');
          const FormData = require('form-data');
          const fs = require('fs');
          let data = new FormData();
          data.append('file', fs.createReadStream(filePath));
          
          let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: process.env.APIURL+'/api/v1/ocr/aadhaar',
            headers: { 
              'Authorization': 'Bearer '+process.env.TOKEN, 
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
            const full_name = data.data.ocr_fields[0].full_name.value;
            console.log("aadhar_number",data.data.ocr_fields[0].aadhaar_number.value);
            if(aadhar_number.length == 12){
            const savedFourDigitsSubstring = aadhar_number.substring(aadhar_number.length - 4);
            const savedFourDigitsSlice = aadhar_number.slice(-4);
            console.log("saved aadhar",lastFourDigitsSubstring);
            console.log("api aadhar",savedFourDigitsSubstring);
            console.log("saved dob",savedDOB);
            console.log("api dob",dob);
            console.log("save Full name ",saveFullName);
            console.log("api Full name ",full_name);
            const similarityPercentageName = Helper.calculateStringSimilarity(saveFullName.toUpperCase(), full_name.toUpperCase());
            const similarityPercentageDOB = Helper.calculateStringSimilarity(savedDOB, dob);  
            console.log("Similarity percent name : ",similarityPercentageName);
            console.log("Similarity percent DOB : ",similarityPercentageDOB);
            if(savedFourDigitsSubstring == lastFourDigitsSubstring && similarityPercentageDOB >= 60 && similarityPercentageName >= 60){
              console.log("RESPONSE : AADHAR MATCH FRONT");
              // updated image name in client aadhar
              const result = await Client.updateOne({ mobile: mobile }, { $set: { aadhar_front: randomUid } });
              if (result.modifiedCount > 0) {
                const matchPer = {
                  name_match : similarityPercentageName,
                  dob_match : similarityPercentageDOB,
                  fullname : full_name.toUpperCase(),
                  DOB : dob,
                  Aadhaar_number : aadhar_number
                }
              res.status(200).json({ status: true, message: 'Aadhar Front Validated Successfully' , data : matchPer });
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
            res.status(200).json({ status: false, message: 'Invalid Aadhar Front Image' });
          }
    
          })
          .catch((error) => {
            const imagePath = path.join(__dirname, '../public/uploads/aadhaar/front',randomUid );
            console.log(imagePath);
            Helper.deleteFileWithRetry(imagePath);
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
        }
    
        console.log("mobile",mobile);
        const panExist = await Client.findOne({ mobile : mobile });
        if (!panExist) {
          return res.status(200).json({ status:false, message:'User Not Exist or PAN number not updated'});
        }

        const aadhVal = await Client.findOne({ mobile : mobile, aadhaar_validation : true });
        if (!aadhVal) {
          return res.status(200).json({ status:false, message:'Please Validate Your Aadhar First'});
        }
    
        if (panExist.aadhar_back != null) {
          return res.status(200).json({ status:false, message:'Aadhar Back Already Uploaded And Validated'});
        }
        
        const panData = await Pan.findOne({ mobile : mobile });
        const maskedAdhar = panData.masked_aadhaar;
        const savedDOB = panData.dob;
        const savedAddress = panData.full;
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
            url: process.env.APIURL+'/api/v1/ocr/aadhaar',
            headers: { 
              'Authorization': 'Bearer '+process.env.TOKEN, 
              ...data.getHeaders()
            },
            data : data
          };
          
          axios.request(config)
          .then(async (response) => {
            const data = response.data;
            //console.log("response data",JSON.stringify(data));
            
            const document_type = data.data.ocr_fields[0].document_type;
            if(document_type == "aadhaar_back"){
            const aadhar_number = data.data.ocr_fields[0].aadhaar_number.value;
            const addressapi = data.data.ocr_fields[0].address.value;

            // remove father name from address 
            const resultArray = addressapi.split(',');
            resultArray.splice(0, 1);
            const address = resultArray.join(',');

            console.log("aadhar_number",data.data.ocr_fields[0].aadhaar_number.value);
            if(aadhar_number.length == 12){
            const savedFourDigitsSubstring = aadhar_number.substring(aadhar_number.length - 4);
            console.log("saved aadhar",lastFourDigitsSubstring);
            console.log("api aadhar",savedFourDigitsSubstring);
            console.log("saved dob",savedDOB);
            console.log("saved Address ",savedAddress);
            console.log("ocr address ",address);
            const similarityPercentageAddress = Helper.calculateStringSimilarity(savedAddress.toUpperCase(), address.toUpperCase());  
            console.log("address similarity Percent : ", similarityPercentageAddress)
            if(savedFourDigitsSubstring == lastFourDigitsSubstring){
              console.log("RESPONSE : AADHAR MATCH BACK");
              // updated image name in client aadhar
              const result = await Client.updateOne({ mobile: mobile }, { $set: { aadhar_back: randomUid,aadhaar_verification:true } });
              if (result.modifiedCount > 0) {
                adharData = await Aadhar.findOne({ mobile: mobile });
                const matchPer = {
                  address_match : similarityPercentageAddress,
                  aadhar_match : "100:00",
                  Aadhaar_number : aadhar_number,
                  Address : addressapi,
                  aadhar_name : adharData.full_name,
                  gender : adharData.gender,
                  dob : adharData.dob
                }
              res.status(200).json({ status: true, message: 'Aadhar Back Validated Successfully', data : matchPer });
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
            res.status(200).json({ status: false, message: 'Invalid Aadhar Back Image' });
          }
    
          })
          .catch((error) => {
            const imagePath = path.join(__dirname, '../public/uploads/aadhaar/back',randomUid );
            console.log(imagePath);
            Helper.deleteFileWithRetry(imagePath);
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

        const checkk = await Client.findOne({ mobile: mobile, aadhaar_validation : true});
        if(checkk){
        return res.status(200).json({ status:true, message:'Aadhaar OTP Validation Already Completed', data : checkk });  
        }
      
        if (Helper.isValidAadharNumber(aadhar)) {
          
          const is_pan = await Client.findOne({ mobile: mobile});
    
          if(!is_pan){
            return res.status(200).json({ status:false, message:'Pan Verification is Pending Or User Not Exist' }); 
          }

          if(is_pan.pan_ocr == null){
            return res.status(200).json({ status:false, message:'Pan OCR is Pending' });  
          }
      
          // const is_aadh = await Client.findOne({ aadhaar_validation: true, mobile: mobile});
          
          // if(!is_aadh){
          //   return res.status(200).json({ status:false, message:'Aadhar Validation is not complete' });
          // }
          const adharData = await Pan.findOne({ mobile: mobile});
          const maskedAdhar = adharData.masked_aadhaar;
          const lastFourDigitsSubstring = maskedAdhar.substring(maskedAdhar.length - 4);
          
      
          const givenDigitsSubstring = aadhar.substring(aadhar.length - 4);
          console.log("Given Aadhar FOur",givenDigitsSubstring);
          console.log("Saved Aadhar FOur",lastFourDigitsSubstring);
    
        if(lastFourDigitsSubstring != givenDigitsSubstring){
          return res.status(200).json({ status:false, message:'Aadhar Not Matched with our record' });
        }
     
        const axios = require('axios');
        let data = JSON.stringify({
          "id_number": aadhar
        });
        
        let config = {
          method: 'post',
          maxBodyLength: Infinity,
          url: process.env.APIURL+'/api/v1/aadhaar-v2/generate-otp',
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': 'Bearer '+process.env.TOKEN
          },
          data : data
        };
          // Make the POST request
          axios.request(config)
          .then(async (response) => {
            const data = response.data;
              console.log('datatatat',JSON.stringify(data));
              if(data.data.otp_sent == true && data.data.status == "generate_otp_success"){
                // const result = await Client.updateOne({ mobile: mobile,aadhaar_number:aadhar }, { $set: {
                //   aadhaar_client_id: data.data.client_id
                //   } });
                // if (result.modifiedCount > 0) {
                return res.status(200).json({ status:true, message: 'Aadhaar OTP sent to your Mobile', data : data.data.client_id });
                //}
              }
            })
            .catch((error) => {
              const imagePath = path.join(__dirname, '../public/uploads/aadhaar/back',randomUid );
              console.log(imagePath);
              Helper.deleteFileWithRetry(imagePath);
              res.status(200).json({ status: false, message: 'Invalid Aadhar Back Image' });
            });
        
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
        const { client_id, otp , mobile } = req.body;
        console.log(req.body)
        if (!client_id || !otp || !mobile) {
          return res.status(200).json({ status:false, message:'Client Id and OTP and Mobile is required' });
        }

        const checkmobile= await Client.findOne({ mobile: mobile});
        if(!checkmobile){
        return res.status(200).json({ status:false, message:'Invalid Mobile', data : '' });  
        }
        
        const checkk = await Client.findOne({ mobile: mobile, aadhaar_validation : true});
        if(checkk){
        return res.status(200).json({ status:false, message:'Aadhaar OTP Validation Already Completed', data : checkk });  
        }
      
        if (otp.toString().length == 6) {
       
        const axios = require('axios');
        let data = JSON.stringify({
          "client_id": client_id,
          "otp" : otp
        });
        
        let config = {
          method: 'post',
          maxBodyLength: Infinity,
          url: process.env.APIURL+'/api/v1/aadhaar-v2/submit-otp',
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': 'Bearer '+process.env.TOKEN
          },
          data : data
        };
      
          // Make the POST request
          axios.request(config)
          .then(async (response) => {
            const data = response.data;
            console.log('data : ',JSON.stringify(data))
           
              if(data.message_code == "success" && data.success == true){
                const cli = new Aadhar({
                  mobile:mobile,
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
                  const result = await Client.updateOne({ mobile : mobile }, { $set: {
                    aadhaar_validation: true
                    } });
                  if (result.modifiedCount > 0) {
                    const addata = await Aadhar.findOne({ mobile : mobile });
                return res.status(200).json({ status:true, message:'Aadhar OTP Validation Success', data : addata }); 
                  }
                }
              } else {
                return res.status(200).json({ status:false, message:'Error while Verifying OTP', data : data });
              }
            }).catch(async (error) => {
              console.log(error.response.data,"catch data")
              
              if(error.response.data.message == "OTP Already Submitted."){
                  const result = await Client.updateOne({ mobile: mobile }, { $set: {
                  aadhaar_validation: true
                  } });
                if (result.modifiedCount > 0) {
                  return res.status(200).json({ status:false, message:'OTP Already Submitted', data : '' });
                 }
              } else {
                return res.status(200).json({ status:false, message:error.response.data.message, data : '' });
              }
             // return res.status(200).json({ status:false, message:error.data.message, data : '' });
            })
        
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