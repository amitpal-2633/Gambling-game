const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("./models/user");
const Admin = require("./models/admin");
const path = require("path");
const app = express();
const PORT = 2000;
const SECRET_KEY = "your_secret_key"; 

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000", 
    credentials: true,
  })
);

app.use(
  express.static(path.join(__dirname, "../frontend"), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".css")) {
        res.setHeader("Content-Type", "text/css");
      } else if (filePath.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript");
      }
    },
  })
);
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect("mongodb://localhost:27017/gambling-app", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on("connected", () => {
  console.log("Connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.log("Error connecting to MongoDB:", err);
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user; 
    next();
  });
};

const authorizeRole = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) return res.sendStatus(403);
    next();
  };
};

// Routes
app.post("/register", async (req, res) => {
  const { username, email, password, role } = req.body;
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser)
      return res.status(400).json({ message: "Username already taken" });

    // Check if user count exceeds the limit (excluding admin)
    const userCount = await User.countDocuments({ role: 'user' });
    if (role === 'user' && userCount >= 4)
      return res.status(400).json({ message: "Maximum number of users reached" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role,
      balance: 1000, 
    });
    await newUser.save();
    res.status(201).json({ message: "User registered" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
app.post("/login", async (req, res) => {
  const { usernameOrEmail, password } = req.body;
  try {
    const user = await User.findOne({
      $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
    });

    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id, role: user.role }, SECRET_KEY, {
      expiresIn: "1h",
    });
    res.json({ token, role: user.role });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Routes
// Set Number
app.post(
  "/admin/setNumber",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    const { number } = req.body;
    if (number < 1 || number > 30)
      return res.status(400).json({ message: "Invalid number" });

    try {
      await Admin.findOneAndUpdate({}, { $set: { number } }, { upsert: true });
      res.json({ message: "Number set successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Fetch All Users for Admin (Including Balance)
app.get(
  "/admin/users",
  authenticateToken,
  authorizeRole("admin"),
  async (req, res) => {
    try {
      const users = await User.find(); 
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// User Routes
// Get User Info (Include Balance)
app.get("/user/info", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId); 
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user); 
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Select Number
// Updated Select Number Logic
app.post("/user/selectNumber", authenticateToken, async (req, res) => {
  const { number } = req.body;
  if (number < 1 || number > 30)
    return res.status(400).json({ message: "Invalid number" });

  try {
    // Fetch the admin's number
    const admin = await Admin.findOne();
    if (!admin)
      return res.status(500).json({ message: "Admin number not set" });

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update the user's selected number
    user.selectedNumber = number;
    await user.save();

    // Get all users who have selected a number
    const users = await User.find({ selectedNumber: { $exists: true } });
    const winners = users.filter((u) => u.selectedNumber === admin.number);
    const losers = users.filter((u) => u.selectedNumber !== admin.number);

    // Determine the amount to be added or subtracted
    const winningAmount = 100;
    const losingAmount = -100;

    // Update balances
    await User.updateMany(
      { _id: { $in: winners.map((u) => u._id) } },
      { $inc: { balance: winningAmount } }
    );

    await User.updateMany(
      { _id: { $in: losers.map((u) => u._id) } },
      { $inc: { balance: losingAmount } }
    );

    res.json({ message: "Number selected and balances updated" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
