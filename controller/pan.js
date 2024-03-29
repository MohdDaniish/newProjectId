const Helper = require('../helper/function');
const Client = require('../models/client.js');
const Pan = require('../models/pan.js');
const sizeOf = require('image-size');
const path = require('path');

async function validatePan(req, res){
    try {
    const { pan, mobile } = req.body;
    if (!pan || !mobile) {
      return res.status(200).json({ status:false, message:'PAN and Mobile number is required', error: 'PAN and Mobile number is required' });
    }
  
    if (Helper.validatePanNumber(pan)) {
    const is_pan = await Client.findOne({ pan_number: pan, mobile : mobile});
  
    if(is_pan){
      const pan_detail = await Pan.findOne({ pan_number: pan});
      console.log("Pan Already Validated");
      return res.status(200).json({ status:false, message:'Pan Already Validated', data : pan_detail });
    }
    
      const apiUrl = process.env.APIURL+"/api/v1/pan/pan-comprehensive";
        
      // Data to be sent in the request body
      const axios = require('axios');
      let data = JSON.stringify({
        "id_number": pan
      });

      let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: process.env.APIURL+'/api/v1/pan/pan-comprehensive',
        headers: { 
          'Authorization': 'Bearer '+process.env.TOKEN, 
          'Content-Type': 'application/json'
        },
        data : data
      };
  
      // Make the POST request
     
      
      axios.request(config).then(async (response) => {
      const dataset = response.data;
      if (dataset) {
        const data = dataset;
        console.log("message : ",data.message);
        if(data.message == "Invalid PAN"){
          return res.status(200).json({ status:true, message:'Invalid PAN', data : '' });
        }
          console.log(dataset,'datatatat');
          const fulnamesplit = data.data.full_name_split;
  
          // Convert the array to a string
          const split_name = fulnamesplit.join(' ');
  
          console.log(split_name);
          console.log('data', data.data.aadhaar_linked);
          const cli = new Client({
            pan_number:data.data.pan_number, 
            mobile : mobile
          });
  
          // Save the business to the database
          const saved = await cli.save();
          if(saved){
            const pandet = new Pan({
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
          const savedpan = await pandet.save();
          if(savedpan){
            const pan_detail = await Pan.findOne({ pan_number: pan});
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
    })
    .catch((error) => {
      console.log(error);
    });
    } else {
      return res.status(200).json({ status:false, message:`${pan} is not a valid PAN number.`});
      console.log(`${pan} is not a valid PAN number.`);
    }
    } catch (error) {
        console.log(error);
        return error;
    }
  
}

async function panOcr(req, res){
    try{
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
    
        //console.log("mobile",mobile);
        const panExist = await Client.findOne({ mobile : mobile });
        if (!panExist) {
          return res.status(200).json({ status:false, message:'User Not Exist or PAN number not updated'});
        }
    
        if (panExist.pan_ocr != null) {
          return res.status(200).json({ status:false, message:'PAN Already Uploaded And Validated'});
        }
        
        const panData = await Pan.findOne({ mobile : mobile });
        const savedfullname = panData.full_name;
        const savdDOB = panData.dob;
        // converting DOB to api date format
        var parts = savdDOB.split("-");
        var year = parts[0];
        var day = parts[2];
        // Extract the month and pad it with leading zero if needed
        var month = (parts[1].length === 1) ? "0" + parts[1] : parts[1];
        const savedDOB = year + "-" + day + "-" + month;
        const savedpan = panData.pan_number;
        
        // uploading aadhar image
        var randomUid = Helper.generateRandomUid(50);
        const extension = path.extname(req.file.originalname).toLowerCase();
        randomUid = randomUid+extension;
        const uploadPath = path.join(__dirname, '../public/uploads/pan', randomUid);
        require('fs').writeFileSync(uploadPath, req.file.buffer);
    
          //console.log("file_name",req.file.originalname);
         
          const filePath = path.join(__dirname, '/../public', 'uploads/pan', randomUid);
          const axios = require('axios');
          const FormData = require('form-data');
          const fs = require('fs');
          let data = new FormData();
          data.append('file', fs.createReadStream(filePath));
          let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: process.env.APIURL+'/api/v1/ocr/pan',
            headers: { 
              'Authorization':  'Bearer '+process.env.TOKEN, 
              ...data.getHeaders()
            },
            data : data
          };
          
          axios.request(config)
          .then(async (response) => {
            const data = response.data;
            console.log("response data",JSON.stringify(response.data));
            
            const document_type = data.data.ocr_fields[0].document_type;
            if(document_type == "pan"){
            const pan_number = data.data.ocr_fields[0].pan_number.value;
            console.log("pan",pan_number);
            const pan_full_name = data.data.ocr_fields[0].full_name.value;
            const dob = data.data.ocr_fields[0].dob.value;
            const father_name = data.data.ocr_fields[0].father_name.value;
    
            // changing date format to 1990-01-01
            const dateString = dob;
            const parts = dateString.split('/');
            const year = parts[2];
            const month = parts[0];
            const day = parts[1];
            const pan_dob = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            console.log("savedfullname : ",savedfullname)
            console.log("api pan_full_name : ",pan_full_name)
            console.log("savedDOB : ",savedDOB)
            console.log("api DOB : ",pan_dob)
            console.log("saved PAN no : ",savedpan)
            console.log("api PAN no : ",pan_number)
            const similarityPercentageName = Helper.calculateStringSimilarity(savedfullname.toUpperCase(), pan_full_name.toUpperCase());
            const similarityPercentageDOB = Helper.calculateStringSimilarity(savedDOB, pan_dob);   
            console.log("similarityPercentageName : ",similarityPercentageName)
            console.log("similarityPercentageDOB : ",similarityPercentageDOB)
            if(pan_number == savedpan && similarityPercentageDOB >= 60 && similarityPercentageName >= 20){
              const matchPer = {
                pan_number_match : "100.00",
                name_match : similarityPercentageName,
                dob_match : similarityPercentageDOB,
                fullname : pan_full_name.toUpperCase(),
                DOB : pan_dob,
                PAN_number : pan_number,
                father_name : father_name
              }
              // updated image name in client aadhar
              const result = await Client.updateOne({ mobile: mobile }, { $set: { pan_ocr: randomUid } });
              if (result.modifiedCount > 0) {
              await Pan.updateOne({ mobile: mobile }, { $set: { father_name: father_name } });  
              res.status(200).json({ status: true, message: 'PAN OCR is Successfull, PAN Image is Valid', data : matchPer });
              } else {
              res.status(200).json({ status: false, message: 'Error While Validating PAN ' });  
              }
            } else {
              // delete uploaded image
              const imagePath = path.join(__dirname, '../public/uploads/pan',randomUid );
              Helper.deleteFileWithRetry(imagePath);
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
            const imagePath = path.join(__dirname, '../public/uploads/pan',randomUid );
            console.log(imagePath);
            Helper.deleteFileWithRetry(imagePath);
            res.status(200).json({ status: false, message: 'Invalid PAN Image' });
          });
    } catch (error){
        console.log(error);
        return error;
    }
}

module.exports = {
    validatePan: validatePan,
    panOcr:panOcr
  }