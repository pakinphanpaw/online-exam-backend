const mongoose = require("mongoose");

const UserAnswerSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  exam_id: { type: String, required: true }, // Use String for UUID
  answers: { type: Object, required: true }, // Assuming answers is an object
  
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("UserAnswer", UserAnswerSchema);