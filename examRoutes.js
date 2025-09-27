const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Exam = require("./models/exam");
const Category = require("./models/category");
const Question = require("./models/question");
const UserAnswer = require("./models/user_answers");
const { v4: uuidv4 } = require("uuid");

router.get("/all", async (req, res) => {
  try {
    const exams = await Exam.find({}, { _id: 1, exam_name: 1, exam_type: 1, description: 1 });
    const formattedExams = exams.map((exam) => ({
      exam_id: exam._id, 
      exam_name: exam.exam_name,
      exam_type: exam.exam_type,
      description: exam.description,
    }));
    res.json({ exams: formattedExams });
  } catch (error) {
    console.error("Error fetching exams:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});




router.get("/exam/:exam_id/completed-students", async (req, res) => {
  const { exam_id } = req.params;

  try {
    const userAnswers = await UserAnswer.find({ exam_id }).populate("user_id", "first_name last_name email");

    if (!userAnswers || userAnswers.length === 0) {
      return res.status(404).json({ message: "No students have completed this exam yet." });
    }
    
    const completedStudents = userAnswers.map((answer) => ({
      student_id: answer.user_id._id,
      name: `${answer.user_id.first_name} ${answer.user_id.last_name}`,
      email: answer.user_id.email,
      score: answer.score,
      maxScore: answer.maxScore,
    }));

    res.status(200).json({ students: completedStudents });
  } catch (error) {
    console.error("Error fetching completed students:", error);
    res.status(500).json({ error: "Failed to fetch completed students." });
  }
});

router.get("/exam-results/:exam_id/:user_id", async (req, res) => {
  const { exam_id, user_id } = req.params;

  try {
    // Fetch the user's answers from the user_answers collection
    const userAnswers = await UserAnswer.findOne({ exam_id, user_id });
    if (!userAnswers) {
      return res.status(404).json({ error: "User's answers not found for this exam" });
    }

    // Fetch the correct answers and tags from the exams collection
    const exam = await Exam.findOne({ _id: exam_id });
    if (!exam) {
      return res.status(404).json({ error: "Exam not found" });
    }

    const correctAnswers = exam.selected_questions.reduce((acc, question) => {
      acc[question.id] = {
        correctAnswer: question.correct_answer,
        tags: question.tags || [], // Ensure tags are included
      };
      return acc;
    }, {});

    // Compare the user's answers with the correct answers
    let score = 0;
    const feedback = {};
    const tagStats = {}; // To store tag-based statistics

    for (const [questionId, userAnswer] of Object.entries(userAnswers.answers)) {
      const questionData = correctAnswers[questionId];
      if (questionData) {
        const isCorrect = userAnswer === questionData.correctAnswer;
        if (isCorrect) {
          score += exam.selected_questions.find(q => q.id === questionId)?.points || 0;
        }

        feedback[questionId] = {
          userAnswer,
          correctAnswer: questionData.correctAnswer,
          isCorrect,
        };

        // Combine tags into a single key
        const combinedTags = questionData.tags.join(","); // Combine tags into a single string
        if (!tagStats[combinedTags]) {
          tagStats[combinedTags] = { correct: 0, total: 0 };
        }
        tagStats[combinedTags].total += 1; // Increment total for this combined tag
        if (isCorrect) {
          tagStats[combinedTags].correct += 1; // Increment correct count for this combined tag
        }
      }
    }

    // Return the result
    res.status(200).json({
      examName: exam.exam_name,
      score,
      maxScore: exam.selected_questions.reduce((sum, q) => sum + (q.points || 0), 0),
      feedback,
      tags: tagStats, // Include combined tag-based feedback
    });
  } catch (error) {
    console.error("Error fetching exam result:", error);
    res.status(500).json({ error: "Failed to fetch exam result" });
  }
});




// Fetch all pre-tests
router.get("/pre-tests", async (req, res) => {
  try {
    // Fetch all exams with type "pre-test"
    const preTests = await Exam.find({ exam_type: "pre-test" }).select("exam_name");
    res.status(200).json(preTests);
  } catch (error) {
    console.error("Error fetching pre-tests:", error);
    res.status(500).json({ message: "Error fetching pre-tests" });
  }
});

router.get("/", async (req, res) => {
  try {
    const exams = await Exam.find().populate("category", "name"); // Populate the category field with its name
    res.status(200).json(exams);
  } catch (error) {
    console.error("Error fetching exams:", error);
    res.status(500).json({ error: "Failed to fetch exams" });
  }
});



router.get("/:examId/questions", async (req, res) => {
  const { examId } = req.params;

  try {
    const exam = await Exam.findById(examId).populate("selected_questions");
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    res.status(200).json({ questions: exam.selected_questions });
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ message: "Error fetching questions", error: error.message });
  }
});


//สร้างข้อสอบใหม่
router.post("/", async (req, res) => {
  try {
    const { exam_name, max_exam, category, description, exam_type, pre_test_id } = req.body;

    let categoryId;

    // Check if the category already exists
    const existingCategory = await Category.findOne({ name: category });
    if (existingCategory) {
      categoryId = existingCategory._id; // Use the existing category's ID
    } else {
      // Create a new category if it doesn't exist
      const newCategory = new Category({ name: category });
      const savedCategory = await newCategory.save();
      categoryId = savedCategory._id; // Use the new category's ID
    }

    // Create the exam
    const newExam = new Exam({
      exam_name,
      max_exam,
      category: categoryId,
      description,
      exam_type,
      pre_test_id: exam_type === "post-test" ? pre_test_id : null, // Only store pre_test_id for Post-Test
    });

    await newExam.save();
    res.status(201).json({ message: "Exam created successfully", exam: newExam });
  } catch (error) {
    console.error("Error creating exam:", error);
    res.status(500).json({ message: "Error creating exam", error: error.message });
  }
});



router.post("/:exam_id/add-question", async (req, res) => {
  const { exam_id } = req.params;
  const { question_text, options, correct_answer, tags, points } = req.body;

  try {
    // Validate input
    if (!question_text || !options || !correct_answer) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Find the exam
    const exam = await Exam.findById(exam_id);
    if (!exam) {
      return res.status(404).json({ error: "Exam not found" });
    }

    // Add the new question to the exam
    const newQuestion = {
      id: new mongoose.Types.ObjectId().toString(), // Generate a unique ID for the question
      question_text,
      options,
      correct_answer,
      tags: tags || [],
      points: points || 1,
    };
    exam.selected_questions.push(newQuestion);
    await exam.save();

    res.status(200).json({ message: "Question added successfully", question: newQuestion });
  } catch (error) {
    console.error("Error adding question:", error);
    res.status(500).json({ error: "Failed to add question" });
  }
});


//สร้างคำถามจากใน Bank
router.post("/:examId/add-questions-from-bank", async (req, res) => {
  const { examId } = req.params;
  const { question_ids } = req.body;

  try {
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    // Fetch questions using `_id` instead of `question_id`
    const questions = await Question.find({ _id: { $in: question_ids } });

    if (questions.length === 0) {
      return res.status(400).json({ message: "No valid questions found in the question bank" });
    }

    if (questions.length !== question_ids.length) {
      console.warn("Some questions were not found in the question bank");
    }

    // Map questions to include all required fields and generate a unique `id`
    const mappedQuestions = questions.map((question) => ({
      id: uuidv4(), // Generate a new unique ID for the question in this exam
      question_text: question.question_text,
      options: question.options,
      correct_answer: question.correct_answer,
      points: question.points,
      tags: question.tags,
    }));

    // Add the full question details to the `selected_questions` array
    exam.selected_questions.push(...mappedQuestions);
    await exam.save();

    res.status(200).json({ message: "Questions added successfully", exam });
  } catch (error) {
    console.error("Error adding questions:", error);
    res.status(500).json({ message: "Error adding questions", error: error.message });
  }
});


// Get all published exams (student-facing)
router.get("/published", async (req, res) => {
  try {
    // Find exams where `published` is true
    const publishedExams = await Exam.find({ published: true }).populate("category", "name");

    res.status(200).json(publishedExams); // Return only published exams
  } catch (err) {
    console.error("Error fetching published exams:", err);
    res.status(500).json({ message: "Error fetching published exams" });
  }
});

router.put("/:examId/publish", async (req, res) => {
  const { examId } = req.params;

  try {
    // Update the `published` field of the exam to `true`
    const updatedExam = await Exam.findByIdAndUpdate(
      examId,
      { published: true },
      { new: true } // Return the updated document
    );

    if (!updatedExam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    res.status(200).json({ message: "Exam published successfully", exam: updatedExam });
  } catch (error) {
    console.error("Error publishing exam:", error);
    res.status(500).json({ message: "Error publishing exam", error: error.message });
  }
});

router.put("/:examId", async (req, res) => {
  const { examId } = req.params;
  const { exam_name, description, max_exam, exam_type, category } = req.body;

  try {
    let categoryId;

    // Check if the category is a valid ObjectId
    if (mongoose.Types.ObjectId.isValid(category)) {
      categoryId = category; // Use the existing ObjectId
    } else {
      // If not, find the category by name
      const existingCategory = await Category.findOne({ name: category });
      if (existingCategory) {
        categoryId = existingCategory._id; // Use the existing category's ObjectId
      } else {
        // If the category doesn't exist, create a new one
        const newCategory = new Category({ name: category });
        const savedCategory = await newCategory.save();
        categoryId = savedCategory._id; // Use the new category's ObjectId
      }
    }

    // Update the exam
    const updatedExam = await Exam.findByIdAndUpdate(
      examId,
      {
        exam_name,
        description,
        max_exam,
        exam_type,
        category: categoryId, // Use the resolved ObjectId
      },
      { new: true } // Return the updated document
    );

    if (!updatedExam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    res.status(200).json({ message: "Exam updated successfully", exam: updatedExam });
  } catch (error) {
    console.error("Error updating exam:", error);
    res.status(500).json({ message: "Error updating exam", error: error.message });
  }
});

router.put("/:examId/questions/:questionId", async (req, res) => {
  const { examId, questionId } = req.params;
  const updatedQuestion = req.body;

  try {
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    // Find the question in the selected_questions array and update it
    const questionIndex = exam.selected_questions.findIndex((q) => q.id === questionId);
    if (questionIndex === -1) {
      return res.status(404).json({ message: "Question not found in the exam" });
    }

    exam.selected_questions[questionIndex] = { ...exam.selected_questions[questionIndex], ...updatedQuestion };
    await exam.save();

    res.status(200).json({ message: "Question updated successfully", exam });
  } catch (error) {
    console.error("Error updating question:", error);
    res.status(500).json({ message: "Error updating question", error: error.message });
  }
});

router.delete("/:examId", async (req, res) => {
  const { examId } = req.params;

  try {
    // Find and delete the exam by its ID
    const deletedExam = await Exam.findByIdAndDelete(examId);

    if (!deletedExam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    res.status(200).json({ message: "Exam deleted successfully" });
  } catch (error) {
    console.error("Error deleting exam:", error);
    res.status(500).json({ message: "Error deleting exam", error: error.message });
  }
});

router.delete("/:examId/questions/:questionId", async (req, res) => {
  const { examId, questionId } = req.params;

  try {
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    // Remove the question from the selected_questions array
    exam.selected_questions = exam.selected_questions.filter((q) => q.id !== questionId);
    await exam.save();

    res.status(200).json({ message: "Question deleted successfully", exam });
  } catch (error) {
    console.error("Error deleting question:", error);
    res.status(500).json({ message: "Error deleting question", error: error.message });
  }
});

module.exports = router;