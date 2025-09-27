const mongoose = require("mongoose");

const ExamSchema = new mongoose.Schema({
  exam_name: { type: String, required: true },
  max_exam: { type: Number, required: true },
  created_at: { type: Date, default: Date.now },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  description: { type: String },
  category_name: { type: String },
  exam_type: { 
    type: String, 
    required: true, 
    enum: ["pre-test", "post-test"],
  },
  published: { type: Boolean, default: false }, // Add this field
  
  // Reference to Pre-Test for Post-Test exams
  pre_test_id: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", default: null },

  selected_questions: [
    {
      id: { type: String, required: true }, // Unique identifier for each question in the exam
      question_text: { type: String, required: true }, // Store the question text
      options: [{ type: String, required: true }], // Store the options
      correct_answer: { type: String, required: true }, // Store the correct answer
      tags: [{ type: String }], // Optional tags for the question
      points: { type: Number, default: 0 }, // Add points field
    },
  ],
});

module.exports = mongoose.models.Exam || mongoose.model("Exam", ExamSchema);