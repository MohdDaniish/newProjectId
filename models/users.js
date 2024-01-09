const mongoose = require('mongoose');

// Define User Schema
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  otp: {
    type: String,
    required: true,
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

// Create a virtual field 'userId' based on 'email'
// userSchema.virtual('userId').get(function () {
//   return this.email;
// });

// Create and export User model
const User = mongoose.model('User', userSchema);

module.exports = User;
