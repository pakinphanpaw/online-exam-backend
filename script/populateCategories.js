const mongoose = require('mongoose');
const Category = require('../models/category'); // Corrected relative path to the Category model

// MongoDB connection URI
const uri = "mongodb+srv://taipangamer45:ZCGqdqKQJ70lIeCV@online-exam-system.nwm8vaa.mongodb.net/online-exam-system?retryWrites=true&w=majority";

const populateCategories = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(uri);
    console.log("MongoDB connected successfully!");

    // Define the categories
    const categories = [
      {
        name: "หมวดเทคโนโลยี",
        tags: [
          "ฮาร์ดแวร์และซอฟต์แวร์ (CPU, Memory, OS, DB, Network)",
          "การพัฒนาโปรแกรม (Programming Basics, Algorithm, Data Structure)",
          "ความปลอดภัยทางไซเบอร์ (Information Security, Encryption)"
        ],
      },
      {
        name: "หมวดวิทยาศาสตร์",
        tags: [
          "ฟิสิกส์ (Physics)",
          "เคมี (Chemistry)",
          "ชีววิทยา (Biology)"
        ],
      },
      {
        name: "หมวดคณิตศาสตร์",
        tags: [
          "พีชคณิต (Algebra)",
          "เรขาคณิต (Geometry)",
          "แคลคูลัส (Calculus)"
        ],
      },
      {
        name: "หมวดประวัติศาสตร์",
        tags: [
          "ประวัติศาสตร์ไทย (Thai History)",
          "ประวัติศาสตร์โลก (World History)",
          "สงครามโลก (World Wars)"
        ],
      },
    ];

    // Insert categories into the database
    await Category.insertMany(categories);
    console.log("Categories created successfully!");

    // Disconnect from MongoDB
    mongoose.disconnect();
  } catch (err) {
    console.error("Error creating categories:", err.message);
  }
};

populateCategories();