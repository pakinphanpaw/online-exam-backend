const mongoose = require("mongoose");
const Exam = require("./models/Exam");
const Category = require("./models/Category");

async function updateExistingExams() {
  try {
   
    await mongoose.connect("mongodb+srv://taipangamer45:ZCGqdqKQJ70lIeCV@online-exam-system.nwm8vaa.mongodb.net/?retryWrites=true&w=majority&appName=online-exam-system", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");


    const exams = await Exam.find();

    for (const exam of exams) {
      
      const category = await Category.findById(exam.category_id);
      if (category) {
   
        exam.category_name = category.category_name;
        await exam.save();
        console.log(`Updated exam ${exam._id} with category_name: ${category.category_name}`);
      } else {
        console.log(`Category not found for exam ${exam._id}`);
      }
    }

    console.log("All exams updated successfully.");
  } catch (err) {
    console.error("Error updating exams:", err);
  } finally {
  
    mongoose.connection.close();
  }
}

updateExistingExams();