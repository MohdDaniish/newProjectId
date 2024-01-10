const mongoose = require('mongoose');

const categoriesSchema = new mongoose.Schema({
    category_name: { type: String, required: true },
    business_code: { type: String, required: true},
    no_of_entity: { type: String, required: true },
    no_of_person: { type: String, required: true },
    area: { type: String, required: true },
    no_of_floors: { type: String, required: true },
    description: { type: String, required: true },
    no_of_staff: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  
});

const Category = mongoose.model('Category', categoriesSchema);

module.exports = Category;