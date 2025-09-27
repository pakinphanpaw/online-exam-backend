
require("dotenv").config();
console.log(">>> RUNNING FILE:", __filename);

const express = require("express");
const cors = require("cors");

// routes
const examRoutes = require("./examRoutes");
const categoryRoutes = require("./categoryRoutes");
const subcategory = require("./subcategory");
const user = require("./user");
const userAnswerRoutes = require("./userAnswers");
const choiceRoutes = require("./choiceRoutes");
const studentAnswerRoutes = require("./studentAnswerRoutes");
const studentExamResultRoutes = require("./studentExamResultRoutes");
const questionRoutes = require("./questionRoutes");

const app = express();


const PORT = process.env.PORT || Number(process.argv[2]) || 5000;


console.log("process.argv:", process.argv);
console.log("PORT variable (after parsing):", PORT);

const mongoose = require("mongoose");
const connectMongoDB = require("./mongo");

console.log("JWT_SECRET:", process.env.JWT_SECRET);

connectMongoDB();

app.use(cors());
app.use(express.json());


app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> handled by port ${PORT}`);
  next();
});
app.use("/exams", examRoutes);
app.use("/categories", categoryRoutes);
app.use("/subcategory", subcategory);
app.use("/user", user);
app.use("/choices", choiceRoutes);
app.use("/student-answers", studentAnswerRoutes);
app.use("/student-exam-result", studentExamResultRoutes);
app.use("/userAnswers", userAnswerRoutes);
app.use("/questions", questionRoutes);

console.log("connectMongoDB:", connectMongoDB);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> handled by port ${PORT}`);
  next();
});