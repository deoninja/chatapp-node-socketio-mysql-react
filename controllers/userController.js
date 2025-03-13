// controllers/userController.js
const mysql = require('mysql');
require('dotenv').config();
const { v4: uuidv4 } = require('uuid'); // Add uuid package for unique IDs

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const connectDb = () => {
  return new Promise((resolve, reject) => {
    db.connect((err) => {
      if (err) {
        console.error("Database connection error:", err.stack);
        reject(err);
      } else {
        console.log("Connected to database");
        resolve();
      }
    });
  });
};

let isDbConnected = false;
connectDb()
  .then(() => { isDbConnected = true; })
  .catch((err) => { isDbConnected = false; });

const registerOrLogin = async (req, res) => {
  const { roleId, firstName, lastName, role } = req.body;

  if (!roleId || !firstName || !lastName || !role) {
    return res.status(400).json({ message: "roleId, firstName, lastName, and role are required" });
  }

  if (!["rider", "client"].includes(role)) {
    return res.status(400).json({ message: "Role must be either 'rider' or 'client'" });
  }

  if (!isDbConnected) {
    return res.status(500).json({ message: "Database connection failed", error: "Unable to connect to the database" });
  }

  try {
    await new Promise((resolve, reject) => {
      db.ping((err) => {
        if (err) reject(new Error("Database connection lost"));
        else resolve();
      });
    });

    const existingUser = await new Promise((resolve, reject) => {
      db.query("SELECT * FROM users WHERE roleId = ? AND role = ?", [roleId, role], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
      });
    });

    if (existingUser) {
      res.cookie("userRole", existingUser.role, { httpOnly: true, sameSite: "Strict", maxAge: 7 * 24 * 60 * 60 * 1000 });
      res.cookie("userId", existingUser.userId, { httpOnly: true, sameSite: "Strict", maxAge: 7 * 24 * 60 * 60 * 1000 });
      return res.status(200).json({
        message: "Login successful",
        user: {
          userId: existingUser.userId,
          roleId: existingUser.roleId,
          firstName: existingUser.firstName,
          lastName: existingUser.lastName,
          role: existingUser.role
        }
      });
    }

    // Generate a unique userId (e.g., UUID or incremental ID)
    const newUserId = uuidv4(); // Or use another method to generate a unique ID

    const newUser = {
      userId: newUserId, // Explicitly include userId
      roleId,
      firstName,
      lastName,
      role,
      created_at: new Date().toISOString()
    };

    const result = await new Promise((resolve, reject) => {
      db.query("INSERT INTO users SET ?", newUser, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    res.cookie("userRole", role, { httpOnly: true, sameSite: "Strict", maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.cookie("userId", newUserId, { httpOnly: true, sameSite: "Strict", maxAge: 7 * 24 * 60 * 60 * 1000 });
    
    res.status(201).json({
      message: "Registration successful",
      user: {
        userId: newUserId,
        roleId,
        firstName,
        lastName,
        role
      }
    });
  } catch (error) {
    console.error("Error in registerOrLogin:", error.stack);
    let errorMessage = "Internal server error";
    if (error.message === "Database connection lost") {
      errorMessage = "Database connection lost. Please try again later.";
    } else if (error.code === "ER_ACCESS_DENIED_ERROR") {
      errorMessage = "Database access denied. Check server configuration.";
    } else if (error.code === "ER_NO_SUCH_TABLE") {
      errorMessage = "Database table 'users' not found.";
    } else if (error.code === "ER_NO_DEFAULT_FOR_FIELD") {
      errorMessage = "Database schema error: 'userId' requires a value.";
    } else {
      errorMessage = error.message;
    }
    res.status(500).json({
      message: errorMessage,
      error: error.message
    });
  }
};

module.exports = { registerOrLogin };