const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const userSchema = new mongoose.Schema({
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role_name: { type: String, default: 'Student' },
}, { timestamps: true });

userSchema.plugin(AutoIncrement, { inc_field: 'user_id' }); // Auto-increment user_id
const User = mongoose.model('User', userSchema);

module.exports = User;