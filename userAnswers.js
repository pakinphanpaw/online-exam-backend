const express = require("express");
const router = express.Router();
const UserAnswer = require("./models/user_answers"); 
const mongoose = require("mongoose");
const Exam = require("./models/exam");
const User = require("./models/users");
const calculateScore = (userAnswers, exam) => {
  let score = 0;

  if (!exam.selected_questions || exam.selected_questions.length === 0) {
    console.error("No selected questions found in the exam");
    return score; 
  }

  exam.selected_questions.forEach((question) => {
    if (userAnswers[question.id] === question.correct_answer) {
      score += typeof question.points === "number" ? question.points : 1; 
    }
  });

  return score;
};

const generateFeedback = (userAnswers, exam) => {
  const groupedTagCounts = {};

  if (!exam.selected_questions || exam.selected_questions.length === 0) {
    console.error("No selected questions found in the exam");
    return []; 
  }

  exam.selected_questions.forEach((question) => {
    const tags = question.tags && question.tags.length > 0 ? question.tags : ["general knowledge"];

   
    if (userAnswers[question.id] !== question.correct_answer) {
      tags.forEach((tag) => {
        if (!groupedTagCounts[tag]) {
          groupedTagCounts[tag] = { incorrect: 0, total: 0 };
        }
        groupedTagCounts[tag].incorrect++;
      });
    }

    
    tags.forEach((tag) => {
      if (!groupedTagCounts[tag]) {
        groupedTagCounts[tag] = { incorrect: 0, total: 0 };
      }
      groupedTagCounts[tag].total++;
    });
  });


  const feedback = Object.entries(groupedTagCounts)
    .filter(([_, counts]) => counts.incorrect > 0) 
    .map(([tag, counts]) => ({
      tag,
      incorrect: counts.incorrect,
      total: counts.total,
    }));

  return feedback;
};

router.get("/completed-exams", async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
   
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid User ID format" });
    }

    
    const completedExamIds = await UserAnswer.find({ user_id: new mongoose.Types.ObjectId(userId) })
      .distinct("exam_id");

    console.log("Completed Exam IDs:", completedExamIds);

    if (completedExamIds.length === 0) {
      return res.status(200).json({ completedExams: [] });
    }

 
    const completedExams = await Exam.find({ _id: { $in: completedExamIds } }).select(
      "_id exam_name exam_type"
    );

    console.log("Completed Exams:", completedExams); 

    
    const completedExamDetails = completedExams.map((exam) => ({
      exam_id: exam._id, 
      exam_name: exam.exam_name,
      exam_type: exam.exam_type,
    }));

    res.status(200).json({ completedExams: completedExamDetails });
  } catch (error) {
    console.error("Error fetching completed exams:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});





router.get("/exam-results/:exam_id/:user_id", async (req, res) => {
  const { exam_id, user_id } = req.params;

  try {
  
    const exam = await Exam.findById(exam_id);
    if (!exam) {
      return res.status(404).json({ error: "Exam not found" });
    }

    let preTestExam = null;
    let postTestExam = null;

    if (exam.exam_type === "pre-test") {
      preTestExam = exam;

      postTestExam = await Exam.findOne({ pre_test_id: exam._id, exam_type: "post-test" });
    } else if (exam.exam_type === "post-test") {
      postTestExam = exam;

      preTestExam = await Exam.findById(exam.pre_test_id);
    }


    const preTestAnswers = preTestExam
      ? await UserAnswer.findOne({ exam_id: preTestExam._id, user_id })
      : null;
    const postTestAnswers = postTestExam
      ? await UserAnswer.findOne({ exam_id: postTestExam._id, user_id })
      : null;

    function getResult(examObj, userAnsObj) {
      if (!examObj || !userAnsObj) return null;

      let score = 0;
      const tagStats = {};

      const maxScore = examObj.max_exam || 0;

      examObj.selected_questions.forEach((question) => {
        const tags = question.tags && question.tags.length > 0 ? question.tags : ["ทั่วไป"];
        const userAns = userAnsObj.answers[question.id];
        const isCorrect = userAns === question.correct_answer;
        const points = typeof question.points === "number" ? question.points : 1;

        if (isCorrect) score += points;

        tags.forEach((tag) => {
          if (!tagStats[tag]) tagStats[tag] = { incorrect: 0, total: 0 };
          if (!isCorrect) tagStats[tag].incorrect += 1;
          tagStats[tag].total += 1;
        });
      });

      const tagFeedback = Object.entries(tagStats).map(([tag, stats]) => ({
        tag,
        incorrect: stats.incorrect,
        total: stats.total,
      }));

      return {
        exam_id: examObj._id,
        exam_name: examObj.exam_name,
        exam_type: examObj.exam_type,
        score,
        maxScore, 
        tagFeedback,
        answers: userAnsObj.answers,
      };
    }

    res.status(200).json({
      preTest: getResult(preTestExam, preTestAnswers),
      postTest: getResult(postTestExam, postTestAnswers),
    });
  } catch (error) {
    console.error("Error fetching exam results:", error);
    res.status(500).json({ error: "Failed to fetch exam results" });
  }
});

router.get("/:examId/question-stats", async (req, res) => {
  const { examId } = req.params;

  try {
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    const userAnswers = await UserAnswer.find({ exam_id: examId });

    const questionStats = exam.selected_questions.map((question) => {
      const total = userAnswers.length;
      const correct = userAnswers.filter(
        (answer) => answer.answers[question.id] === question.correct_answer
      ).length;

      const percentage = total > 0 ? (correct / total) * 100 : 0;

      return {
        question_text: question.question_text,
        correct,
        total,
        percentage: percentage.toFixed(2), 
      };
    });

    res.json({ questionStats });
  } catch (error) {
    console.error("Error fetching question statistics:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:examId/users", async (req, res) => {
  const { examId } = req.params;

  try {

    const userAnswers = await UserAnswer.find({ exam_id: examId });


    const userIds = [...new Set(userAnswers.map((answer) => answer.user_id))];

    const users = await User.find({ _id: { $in: userIds } }, { _id: 1, first_name: 1, last_name: 1, username: 1 });

 
    const formattedUsers = users.map((user) => ({
      user_id: user._id,
      user_name: `${user.first_name} ${user.last_name}`.trim() || user.username, 
    }));

    res.json({ users: formattedUsers });
  } catch (error) {
    console.error("Error fetching users for exam:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:examId/user/:userId", async (req, res) => {
  const { examId, userId } = req.params;

  try {

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ error: "Exam not found" });
    }


    const userAnswer = await UserAnswer.findOne({ exam_id: examId, user_id: userId });
    if (!userAnswer) {
      return res.status(404).json({ error: "User's answers not found for this exam" });
    }

 
    const questionStats = exam.selected_questions.map((question) => {
      const userAnswerForQuestion = userAnswer.answers[question.id];
      const isCorrect = userAnswerForQuestion === question.correct_answer;

      return {
        question_id: question.id,
        question_text: question.question_text,
        user_answer: userAnswerForQuestion,
        correct_answer: question.correct_answer,
        is_correct: isCorrect,
        points: typeof question.points === "number" ? question.points : 1,
      };
    });

    
    const result = {
      exam_id: exam._id,
      exam_name: exam.exam_name,
      exam_type: exam.exam_type,
      score: calculateScore(userAnswer.answers, exam),
      maxScore: exam.max_exam || 0, 
      questionStats, 
    };

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching user's exam results:", error);
    res.status(500).json({ error: "Failed to fetch user's exam results" });
  }
});

router.get("/get-user-exams", async (req, res) => {
  const { user_id } = req.query;

  try {
 
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      console.error("Invalid user_id format:", user_id);
      return res.status(400).json({ error: "Invalid user_id format" });
    }

    
    const userAnswers = await UserAnswer.find({ user_id: new mongoose.Types.ObjectId(user_id) });
    console.log("User Answers:", userAnswers);

    if (!userAnswers || userAnswers.length === 0) {
      console.warn("No completed exams found for user_id:", user_id);
      return res.status(404).json({ error: "No completed exams found for this user" });
    }

   
    const exams = await Promise.all(
      userAnswers.map(async (userAnswer) => {
        console.log("Fetching exam for exam_id:", userAnswer.exam_id); 

  
        const exam = await Exam.findOne({ _id: new mongoose.Types.ObjectId(userAnswer.exam_id) });
        console.log("Exam fetched:", exam);

        if (!exam) {
          console.error(`Exam not found for exam_id: ${userAnswer.exam_id}`);
          return null;
        }

        return {
          exam_id: exam._id, 
          name: exam.exam_name,
          exam_type: exam.exam_type,
        };
      })
    );

   
    const validExams = exams.filter((exam) => exam !== null);
    console.log("Valid Exams:", validExams); 

    res.status(200).json({ exams: validExams });
  } catch (error) {
    console.error("Error fetching completed exams:", error);
    res.status(500).json({ error: "Failed to fetch completed exams" });
  }
});



router.post("/save-answers", async (req, res) => {
  console.log("Request body:", req.body);
  const { user_id, exam_id, answers } = req.body;

  try {
    const userAnswer = new UserAnswer({
      user_id,
      exam_id, 
      answers,
    });
    await userAnswer.save();

    res.status(200).json({ message: "Answers saved successfully" });
  } catch (error) {
    console.error("Error saving answers:", error);
    res.status(500).json({ error: "Failed to save answers" });
  }
});

module.exports = router;