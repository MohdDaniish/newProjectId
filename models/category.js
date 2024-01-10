const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
    category_name: { type: String, required: true, unique: true },
    category_code: { type: String, required: true, unique: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const Category = mongoose.model('Category', CategorySchema);

module.exports = Category;