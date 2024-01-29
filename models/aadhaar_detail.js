const mongoose = require('mongoose');

const aadharSchema = new mongoose.Schema({
  mobile: { type: String },
  client_id: { type: String },
  full_name: { type: String },
  aadhaar_number: { type: String },
  dob: { type: String },
  gender: { type: String },
  country: { type: String },
  dist: { type: String },
  state: { type: String },
  po: { type: String },
  loc: { type: String },
  vtc: { type: String, required: true },
  subdist: { type : String, required : true},
  street: { type: String },
  house: { type: String },
  landmark: { type: String },
  face_status: { type: Boolean },
  face_score: { type: String },
  zip: { type: String },
  profile_image: { type: String },
  has_image: { type: Boolean},
  raw_xml: { type: String},
  zip_data: { type: String},
  care_of: { type: String},
  uniqueness_id: { type: String},
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Aadhar = mongoose.model('Aadhar', aadharSchema);

module.exports = Aadhar;
