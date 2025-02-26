const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();
const mysql = require("mysql");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "http://localhost:5173", credentials: true } });

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Serve React frontend
app.use(express.static(path.join(__dirname, "client", "dist")));

// Catch-all route to serve React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "dist", "index.html"));
});

// Database Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) {
    console.error("Database connection error:", err);
  } else {
    console.log("Connected to database");
  }
});

// Store active users
let users = {}; // Store users with their socket IDs
let activeUsers = new Set();

// Route to Set User Role in Cookie
app.post("/set-role", (req, res) => {
  const { userId, role } = req.body;

  if (!userId || !role) {
    return res.status(400).json({ message: "User ID and role are required" });
  }

  res.cookie("userRole", role, { httpOnly: true, sameSite: "Strict", maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.cookie("userId", userId, { httpOnly: true, sameSite: "Strict", maxAge: 7 * 24 * 60 * 60 * 1000 });

  res.json({ message: "Role set in cookies" });
});

app.get("/get-role", (req, res) => {
  const userRole = req.cookies.userRole;
  const userId = req.cookies.userId;

  if (!userRole || !userId) {
    return res.status(400).json({ message: "No role found" });
  }

  res.json({ role: userRole, userId });
});

// WebSocket Logic
io.on("connection", (socket) => {
  socket.on("join", async ({ userId, role }) => {
    users[userId] = { socketId: socket.id, role };
    activeUsers.add(userId);

    // Fetch previous messages
    db.query(
      "SELECT sender, recipient, message, timestamp FROM messages WHERE sender = ? OR recipient = ? ORDER BY timestamp ASC",
      [userId, userId],
      (err, results) => {
        if (err) {
          console.error("Error fetching messages:", err);
        } else {
          socket.emit("loadMessages", results); // Send messages to client
        }
      }
    );

    io.emit("activeUsers", Array.from(activeUsers)); // Broadcast active users
  });

  socket.on("sendMessage", ({ sender, recipient, message }) => {
    if (users[sender].role === "user" && recipient !== "admin") return;

    db.query("INSERT INTO messages (sender, recipient, message) VALUES (?, ?, ?)", [sender, recipient, message], (err) => {
      if (err) console.error("Error saving message:", err);
    });

    if (users[recipient]) {
      io.to(users[recipient].socketId).emit("receiveMessage", { sender, message });
    }
  });

  socket.on("disconnect", () => {
    for (let userId in users) {
      if (users[userId].socketId === socket.id) {
        delete users[userId];
        activeUsers.delete(userId);
        io.emit("activeUsers", Array.from(activeUsers));
        break;
      }
    }
  });
});

server.listen(5000, () => console.log("Server running on port 5000"));