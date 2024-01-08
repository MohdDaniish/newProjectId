const mongoose = require('mongoose');

// Define User Schema
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const UserOtp = mongoose.model('User_otp', userSchema);

module.exports = UserOtp;
