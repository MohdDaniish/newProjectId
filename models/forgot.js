const mongoose = require('mongoose');

// Define User Schema
const forgotSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  otp: {
    type: String,
    required: false,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  expires_at: {
    type: Date,
    default: () => new Date(Date.now() + 5 * 60 * 1000),
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Forgot = mongoose.model('Forgot', forgotSchema);

module.exports = Forgot;
