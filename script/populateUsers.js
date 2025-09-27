const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/users'); // Import the User model

// MongoDB connection URI
const uri = "mongodb+srv://taipangamer45:ZCGqdqKQJ70lIeCV@online-exam-system.nwm8vaa.mongodb.net/online-exam-system?retryWrites=true&w=majority";

const populateUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(uri);
    console.log("MongoDB connected successfully!");

    // Define the users
    const users = [
      {
        first_name: "John",
        last_name: "Doe",
        username: "johndoe",
        password: await bcrypt.hash("password123", 10), // Hash the password
        role_name: "Admin", // Use role_name instead of role_id
      },
      {
        first_name: "Jane",
        last_name: "Smith",
        username: "janesmith",
        password: await bcrypt.hash("password123", 10), // Hash the password
        role_name: "Teacher", // Use role_name instead of role_id
      },
      {
        first_name: "Alice",
        last_name: "Johnson",
        username: "alicejohnson",
        password: await bcrypt.hash("password123", 10), // Hash the password
        role_name: "Student", // Use role_name instead of role_id
      },
    ];

    // Insert users into the database
    await User.insertMany(users);
    console.log("Users created successfully!");

    // Disconnect from MongoDB
    mongoose.disconnect();
  } catch (err) {
    console.error("Error creating users:", err.message);
  }
};

populateUsers();