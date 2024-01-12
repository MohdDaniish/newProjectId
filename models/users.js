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
  google_id: {
    type:String
  },
  social_name: {
    type:String
  },
  social_image: {
    type:String
  },
  is_social: {
    type: Boolean,
    default: false,  
  },
  password: {
    type: String,
    required: false,
  },
  userId: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  isVerified: {
    type: Boolean,
    default: true,
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
