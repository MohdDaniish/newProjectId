const Helper = require('../helper/function');
const Client = require('../models/client.js');
const voter = require('../models/voter.js');
const aadhaar = require('../models/aadhaar_detail.js');

async function votervalidation(req,res) {
    try {
        // Create a nodemailer transporter with your email service credentials
        const { voter_id, mobile } = req.body;
        console.log("Voter id",voter_id)
        if (!voter_id || !mobile) {
            return res.status(200).json({ status:false, message:'Voter Id and Mobile number is required' }); 
        }
      
        if (Helper.isValidIndianVoterId(voter_id)) {
        const is_aad = await Client.findOne({ mobile: mobile, aadhaar_verification : true});
    
        if(!is_aad){
          return res.status(200).json({ status:false, message:'Aadhaar Verification is Pending Or User Not Exist' }); 
        }
    
        const is_vot = await Client.findOne({ voter_validation: true, mobile: mobile});
        
        if(is_vot){
          const _detail = is_vot;
          console.log("Saved Record");
          return res.status(200).json({ status:true, message:'Voter Already Validated', data : _detail });
        }

          const apiUrl = "https://sandbox.surepass.io/api/v1/voter-id/voter-id";
            
          // Data to be sent in the request body
          const postData = {
            id_number: voter_id,
          };
      
          // Options for the fetch request
          const options = {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization:
                "Bearer "+process.env.TOKEN, // Replace with your actual access token
            },
            body: JSON.stringify(postData),
          };
      
          // Make the POST request
          const response = await fetch(apiUrl, options);
          const dataset = await response.json();
      
          if (dataset) {
            const data = dataset;
              console.log(dataset,'datatatat');
            //   const result = await Client.updateOne({ mobile: mobile }, { $set: {
            //     aadhaar_number: data.data.aadhaar_number,
            //     aadhaar_validation : true
            //     } });
            //   if (result.modifiedCount > 0) {
                const is_aadha = await aadhaar.findOne({ mobile: mobile});
              if(is_aadha){
                const savedfullname = is_aadha.full_name;
                const votername = data.data.name;
                const similarityPercentage = Helper.calculateStringSimilarity(savedfullname, votername);
                if(similarityPercentage >= 50){
                    const cli = new voter({
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
                      return res.status(200).json({ status:true, message:'Aadhaar Validated', data : _details }); 
                } else {

                }
              } else {
                return res.status(200).json({ status:false, message:'Error while Validating Aadhaar details', data : '' });
              }
            //   } else {
            //     return res.status(200).json({ status:true, message:'Aadhaar data saved' });
            //   }
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