const mongoose = require('mongoose');
const Role = require('../models/roles');
const uri = "mongodb+srv://taipangamer45:ZCGqdqKQJ70lIeCV@online-exam-system.nwm8vaa.mongodb.net/online-exam-system?retryWrites=true&w=majority";

const populateRoles = async () => {
  try {
    await mongoose.connect(uri);
    console.log("MongoDB connected successfully!");

  
    const roles = [
      { role_id: 1, role_name: "Admin" },
      { role_id: 2, role_name: "Teacher" },
      { role_id: 3, role_name: "Student" },
    ];

    
    await Role.insertMany(roles);
    console.log("Roles created successfully!");

 
    mongoose.disconnect();
  } catch (err) {
    console.error("Error creating roles:", err.message);
  }
};

populateRoles();