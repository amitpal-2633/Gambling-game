const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" }, 
  selectedNumber: { type: Number, default: null },
  balance: { type: Number, default: 0 },
});

module.exports = mongoose.model("User", userSchema);
