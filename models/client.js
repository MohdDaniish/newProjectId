const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  aadhaar_linked: { type: Boolean },
  city: { type: String },
  country: { type: String },
  full: { type: String },
  line_1: { type: String },
  line_2: { type: String },
  state: { type: String },
  street_name: { type: String },
  zip: { type: String },
  category: { type: String },
  client_id: { type: String, required: true },
  dob: { type : String, required : true},
  dob_check: { type: Boolean },
  dob_verified: { type: Boolean },
  email: { type: String },
  full_name: { type: String },
  full_name_split: { type: String },
  gender: { type: String },
  input_dob: { type: String },
  less_info: { type: Boolean },
  masked_aadhaar: { type: String },
  pan_number: { type: String, unique: true, required: true },
  phone_number: String,
  mobile: { type : String, unique: true, required: true },
  pan_ocr:  {
    type: String,
    default: null,
  },
  aadhar_front:  {
    type: String,
    default: null,
  },
  aadhar_back: {
    type: String,
    default: null, 
  },
  voter_front: {
    type: String,
    default: null, 
  },
  voter_back: {
    type: String,
    default: null,
  },
  aadhaar_number: {
    type: String,
    default: null,
  },
  aadhaar_validation: { 
    type: Boolean,
    default: false,
  },
  aadhaar_verification: { 
    type: Boolean,
    default: false,
  },
  kyc_status: { 
    type: Boolean,
    default: false,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;
