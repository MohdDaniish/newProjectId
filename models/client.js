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
  pan_number: { type: String, required: true },
  phone_number: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;
