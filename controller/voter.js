const Helper = require('../helper/function');

async function votervalidation(req,res) {
    try {
        // Create a nodemailer transporter with your email service credentials
        const { voter_id, mobile } = req.body;
        console.log("Voter id",voter_id)
        if (!voter_id || !mobile) {
            return res.status(200).json({ status:false, message:'Voter Id and Mobile number is required' }); 
        }
      
        if (Helper.isValidIndianVoterId(voter_id)) {
        const is_pan = await Client.findOne({ mobile: mobile, aadhaar_verification : true});
    
        if(!is_pan){
          return res.status(200).json({ status:false, message:'Aadhaar Verification is Pending Or User Not Exist' }); 
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
          console.log(`${voter_id} is not a valid Voter Id.`);
          return res.status(200).json({ status:false, message:`${voter_id} is not a valid Voter Id.` });
        }
    } catch (error) {
        console.log(error);
        return error;
    }
  }

  module.exports = {
    votervalidation: votervalidation,
  }