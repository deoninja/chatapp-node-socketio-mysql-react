// controllers/userController.js
const mysql = require('mysql');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) console.error("Database connection error:", err);
  else console.log("Connected to database");
});

const registerOrLogin = async (req, res) => {
  const { id, firstName, lastName, role } = req.body;

  if (!id || !firstName || !lastName || !role) {
    return res.status(400).json({ message: "ID, firstName, lastName, and role are required" });
  }

  if (!["rider", "client"].includes(role)) {
    return res.status(400).json({ message: "Role must be either 'rider' or 'client'" });
  }

  try {
    // Check if user already exists
    const existingUser = await new Promise((resolve, reject) => {
      db.query("SELECT * FROM users WHERE userId = ?", [id], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });

    if (existingUser) {
      // User exists, login
      res.cookie("userRole", existingUser.role, { httpOnly: true, sameSite: "Strict", maxAge: 7 * 24 * 60 * 60 * 1000 });
      res.cookie("userId", existingUser.userId, { httpOnly: true, sameSite: "Strict", maxAge: 7 * 24 * 60 * 60 * 1000 });
      return res.status(200).json({
        message: "Login successful",
        user: {
          userId: existingUser.userId,
          firstName: existingUser.firstName,
          lastName: existingUser.lastName,
          role: existingUser.role
        }
      });
    }

    // New user, register
    const newUser = {
      userId: id,
      firstName,
      lastName,
      role,
      created_at: new Date().toISOString()
    };

    await new Promise((resolve, reject) => {
      db.query("INSERT INTO users SET ?", newUser, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    res.cookie("userRole", role, { httpOnly: true, sameSite: "Strict", maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.cookie("userId", id, { httpOnly: true, sameSite: "Strict", maxAge: 7 * 24 * 60 * 60 * 1000 });
    
    res.status(201).json({
      message: "Registration successful",
      user: {
        userId: id,
        firstName,
        lastName,
        role
      }
    });
  } catch (error) {
    console.error("Error in registerOrLogin:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  registerOrLogin
};