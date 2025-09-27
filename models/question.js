const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  
  question_text: { type: String, required: true },
  options: { type: [String], required: true },
  correct_answer: { type: String, required: true },
  points: { type: Number, required: true },
  category: { type: String, required: true }, // Ensure category is required
});

module.exports = mongoose.model("Question", questionSchema);