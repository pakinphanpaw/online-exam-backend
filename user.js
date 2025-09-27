const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const jwt = require("jsonwebtoken");
const User = require('./models/users'); 
require("dotenv").config();
const router = express.Router();
router.use(cors());

router.get('/', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get("/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select("first_name last_name email");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    res.status(500).json({ message: "Server error" });
  }
});


router.get('/check-username', async (req, res) => {
    const { username } = req.query;

    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(200).json({ exists: true });
        }
        res.status(200).json({ exists: false });
    } catch (err) {
        console.error('Error checking username:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/', async (req, res) => {
    const { first_name, last_name, username, password, confirm_password, role_name = "Student" } = req.body;

    
    if (password !== confirm_password) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }

    try {
        
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username is already taken' });
        }

        
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            first_name,
            last_name,
            username,
            password: hashedPassword,
            role_name,
        });
        const savedUser = await newUser.save();

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                user_id: savedUser.user_id,
                first_name: savedUser.first_name,
                last_name: savedUser.last_name,
                username: savedUser.username,
                role_name: savedUser.role_name,
            },
        });
    } catch (err) {
        console.error('Error creating user:', err);
        res.status(500).json({ message: 'Server error' });
    }
});


router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  console.log(">>> login request:", { username, password });
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const token = jwt.sign({ id: user._id, role: user.role_name }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.status(200).json({
      token,
      role: user.role_name,
      name: `${user.first_name} ${user.last_name}`,
      user: {
        _id: user._id,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Server error" });
  }
  
});


router.put('/:id', async (req, res) => {
    const { id } = req.params; 
    const { first_name, last_name, role_name } = req.body;
  
    try {
      const updatedUser = await User.findByIdAndUpdate(
        id, // Query by _id
        { first_name, last_name, role_name },
        { new: true } 
      );
  
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.status(200).json({
        message: 'User updated successfully',
        user: updatedUser,
      });
    } catch (err) {
      console.error('Error updating user:', err);
      res.status(500).json({ message: 'Server error' });
    }
  });


router.delete('/:id', async (req, res) => {
    const { id } = req.params; 
  
    try {
      const deletedUser = await User.findByIdAndDelete(id); 
  
      if (!deletedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.status(200).json({
        message: 'User deleted successfully',
        user: deletedUser,
      });
    } catch (err) {
      console.error('Error deleting user:', err);
      res.status(500).json({ message: 'Server error' });
    }
  });
module.exports = router;