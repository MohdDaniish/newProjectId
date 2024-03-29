const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  pan_number: { type: String, unique: true, required: true },
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
  aadhaar_client_id: { 
    type: String,
    default: null,
  },
  voter_validation:{
    type: Boolean,
    default: false,
  },
  voter_ocr:  {
    type: String,
    default: null,
  },
  license_validation:{
    type: Boolean,
    default: false,
  },
  license_ocr:  {
    type: String,
    default: null,
  },
  passport_validation:{
    type: Boolean,
    default: false,
  },
  passport_ocr:  {
    type: String,
    default: null,
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
