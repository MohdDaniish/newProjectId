const mongoose = require('mongoose');

const guestSchema = new mongoose.Schema({
    category_id: { type: String, required: true },
    business_code: { type: String, required: true},
    name: { type: String, required: true },
    purpose: { type: String, required: true },
    person_id: { type: String, required: true },
    mobile: { type: Number, required: true, unique: true, validate: {
        validator: function(value) {
            return /^\d{10}$/.test(value);
        },
        message: 'Guest phone must be a numeric string with exactly 10 digits.'
    }},
    status: { type: String, required: true },
    address: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
   
});

const Guest = mongoose.model('Category', guestSchema);

module.exports = Guest;