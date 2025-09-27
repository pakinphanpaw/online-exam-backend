const mongoose = require('mongoose');

// Define the schema for the categories collection
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // Category name
  tags: { type: [String], required: true }, // Array of tags
}, { timestamps: true }); // Automatically add createdAt and updatedAt fields

// Check if the model already exists before defining it
module.exports = mongoose.models.Category || mongoose.model('Category', categorySchema);