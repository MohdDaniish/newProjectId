const mongoose = require('mongoose');

const voterDataSchema = new mongoose.Schema({
  mobile: { type: String },
  client_id: { type: String },
  epic_no: { type: String },
  gender: { type: String },
  state: { type: String },
  name: { type: String },
  relation_name: { type: String },
  relation_type: { type: String },
  house_no: { type: String },
  dob: { type: String },
  age: { type: String },
  area: { type: String },
  multiple: { type: Boolean },
  last_update: { type: Date },
  assembly_constituency: { type: String },
  assembly_constituency_number: { type: String },
  polling_station: { type: String },
  part_number: { type: String },
  part_name: { type: String },
  parliamentary_constituency: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const VoterData = mongoose.model('VoterData', voterDataSchema);

module.exports = VoterData;

