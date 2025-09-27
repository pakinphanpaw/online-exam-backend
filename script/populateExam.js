const mongoose = require("mongoose");
const Exam = require("../models/exam"); // Adjust the path to your Exam model

async function populateExamCollection() {
  try {
    // Connect to your MongoDB database
    await mongoose.connect("mongodb+srv://taipangamer45:ZCGqdqKQJ70lIeCV@online-exam-system.nwm8vaa.mongodb.net/test?retryWrites=true&w=majority", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    // Example data to populate the Exam collection
    const exams = [
      {
        exam_id: "EX001",
        exam_name: "Math Exam",
        max_exam: 100,
        category_id: "67ee551a4ecf06b82eb21228", // Replace with a valid ObjectId from your Category collection
        category_name: "Mathematics",
        description: "This is a math exam.",
        created_by: "67efaeda2dde1419adb61fc6", // Replace with a valid ObjectId or user_id
        exam_type: "pre-test",
      },
      {
        exam_id: "EX002",
        exam_name: "Science Exam",
        max_exam: 100,
        category_id: "67ee551a4ecf06b82eb21229", // Replace with a valid ObjectId from your Category collection
        category_name: "Science",
        description: "This is a science exam.",
        created_by: "67efaeda2dde1419adb61fc6", // Replace with a valid ObjectId or user_id
        exam_type: "post-test",
      },
    ];

    // Insert the data into the Exam collection
    await Exam.insertMany(exams);
    console.log("Exam collection repopulated successfully.");
  } catch (err) {
    console.error("Error populating Exam collection:", err);
  } finally {
    // Close the database connection
    mongoose.connection.close();
  }
}

// Run the script
populateExamCollection();