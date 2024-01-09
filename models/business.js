const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true
    },
    business_name: {
        type: String,
        required: true
    },
    business_address: {
        type: String,
        required: true
    },
    business_location: {
        type: String,
        required: true
    },
    business_pin: {
        type: String,
        required: true,
        validate: {
            validator: function(value) {
                // Check if the value is a numeric string and has exactly 6 digits
                return /^\d{6}$/.test(value);
            },
            message: 'Business pin must be a numeric string with exactly 6 digits.'
        }
    },
    business_phone: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function(value) {
                return /^\d{10}$/.test(value);
            },
            message: 'Business phone must be a numeric string with exactly 10 digits.'
        }
    },
    business_code: {
        type: Number,
        required: true
    },
    category: {
        type: String 
     },
     createdAt: { type: Date, default: Date.now },
     updatedAt: { type: Date, default: Date.now },
});

const Business = mongoose.model('Business', businessSchema);

module.exports = Business;
