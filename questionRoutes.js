const express = require("express");
const router = express.Router();
const Question = require("./models/question");


router.post("/", async (req, res) => {
  try {
    const { question_text, options, correct_answer, points, category } = req.body;


    const question = new Question({
      question_text,
      options,
      correct_answer,
      points,
      category,
    });

    await question.save();

    res.status(201).json({ message: "Question added to the question bank successfully", question });
  } catch (error) {
    console.error("Error adding question to the question bank:", error);
    res.status(500).json({ error: "Failed to add question to the question bank" });
  }
});


router.get("/", async (req, res) => {
  try {
    const { category } = req.query;

    let query = {};
    if (category) {
      query = { category };
    }

    const questions = await Question.find(query); 
    res.status(200).json(questions);
  } catch (error) {
    console.error("Error fetching questions from the question bank:", error);
    res.status(500).json({ error: "Failed to fetch questions from the question bank" });
  }
});


router.get("/:question_id", async (req, res) => {
  try {
    const { question_id } = req.params;

    const question = await Question.findOne({ question_id });
    if (!question) {
      return res.status(404).json({ error: "Question not found in the question bank" });
    }

    res.status(200).json(question);
  } catch (error) {
    console.error("Error fetching question from the question bank:", error);
    res.status(500).json({ error: "Failed to fetch question from the question bank" });
  }
});


router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;


    const updatedQuestion = await Question.findByIdAndUpdate(id, req.body, { new: true });

    if (!updatedQuestion) {
      return res.status(404).json({ error: "Question not found in the question bank" });
    }

    res.status(200).json({ message: "Question updated successfully", question: updatedQuestion });
  } catch (error) {
    console.error("Error updating question in the question bank:", error);
    res.status(500).json({ error: "Failed to update question in the question bank" });
  }
});


router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

   
    const question = await Question.findByIdAndDelete(id);
    if (!question) {
      return res.status(404).json({ error: "Question not found in the question bank" });
    }

    res.status(200).json({ message: "Question deleted successfully" });
  } catch (error) {
    console.error("Error deleting question from the question bank:", error);
    res.status(500).json({ error: "Failed to delete question from the question bank" });
  }
});

module.exports = router;