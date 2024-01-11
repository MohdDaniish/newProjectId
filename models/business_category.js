const mongoose = require('mongoose');

const businessCategorySchema = new mongoose.Schema({
    category_code: { type: String, required: true },
    business_code: { type: String, required: true},
    no_of_entity: { type: String, required: true },
    no_of_person: { type: String, required: false },
    area: { type: String, required: false },
    no_of_floors: { type: String, required: true },
    description: { type: String, required: true },
    no_of_staff: { type: String, required: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  
});

const BusinessCategory = mongoose.model('BusinessCategory', businessCategorySchema);

module.exports = BusinessCategory;