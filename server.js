const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();
const mysql = require("mysql");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");
const userRoutes = require('./routes/userRoutes');

const pHost = process.env.PUBLIC_HOST;

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: pHost, credentials: true } });

app.use(cors({ origin: pHost, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "client", "dist")));
app.use('/api/users', userRoutes);

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "dist", "index.html"));
});

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) console.error("Database connection error:", err.stack);
  else console.log("Connected to database");
});

function getAllUsers() {
  return new Promise((resolve, reject) => {
    db.query("SELECT userId, role, firstName, lastName FROM users", (err, results) => {
      if (err) reject(err);
      else resolve(results.map(row => ({
        userId: row.userId,
        role: row.role,
        firstName: row.firstName,
        lastName: row.lastName
      })));
    });
  });
}

let users = {};
let activeUsers = new Set();

io.on("connection", (socket) => {
  console.log(`New connection from socket ID: ${socket.id}`);

  socket.on("join", async ({ userId, role }) => {
    console.log(`User ${userId} with role ${role} attempting to join`);
    if (!userId || !role) return;

    users[userId] = { socketId: socket.id, role };
    activeUsers.add(userId);

    db.query(
      "SELECT id, sender, recipient, message, timestamp, is_read, read_at FROM messages WHERE sender = ? OR recipient = ? ORDER BY timestamp ASC",
      [userId, userId],
      (err, results) => {
        if (err) {
          console.error(`Error fetching messages for ${userId}:`, err.stack);
          return;
        }
        socket.emit("loadMessages", results);
      }
    );

    try {
      const allUsers = await getAllUsers();
      const activeRiders = Array.from(activeUsers).filter((id) => users[id]?.role === "rider");
      const activeClients = Array.from(activeUsers).filter((id) => users[id]?.role === "client");

      if (role === "rider") {
        const clientList = allUsers.filter((u) => u.role === "client");
        socket.emit("allClients", clientList);
        io.emit("activeClients", activeClients);
      } else {
        const riderList = allUsers.filter((u) => u.role === "rider");
        socket.emit("availableRiders", riderList);
        io.emit("activeRiders", activeRiders);
      }

      io.emit("activeRiders", activeRiders);
      io.emit("activeClients", activeClients);
    } catch (err) {
      console.error(`Error fetching all users for ${userId}:`, err.stack);
    }
  });

  socket.on("sendMessage", ({ sender, recipient, message, timestamp }) => {
    if (users[sender]?.role === "client" && users[recipient]?.role !== "rider") return;

    const newMessage = { sender, recipient, message, timestamp, is_read: 0, read_at: null };

    db.query(
      "INSERT INTO messages (sender, recipient, message, timestamp, is_read, read_at) VALUES (?, ?, ?, ?, ?, ?)",
      [sender, recipient, message, timestamp, 0, null],
      (err, result) => {
        if (err) {
          console.error(`Error saving message:`, err.stack);
          return;
        }
        newMessage.id = result.insertId;
        if (users[recipient]) io.to(users[recipient].socketId).emit("receiveMessage", newMessage);
        if (users[sender]) io.to(users[sender].socketId).emit("receiveMessage", newMessage);
      }
    );
  });

  socket.on("markMessageRead", ({ messageId, read_at }) => {
    if (!messageId || !read_at) {
      console.error("Invalid markMessageRead data:", { messageId, read_at });
      return;
    }
    db.query(
      "UPDATE messages SET is_read = 1, read_at = ? WHERE id = ? AND is_read = 0",
      [read_at, messageId],
      (err, result) => {
        if (err) {
          console.error(`Error marking message ${messageId} as read:`, err.stack);
          return;
        }
        if (result.affectedRows > 0) {
          db.query(
            "SELECT sender, recipient FROM messages WHERE id = ?",
            [messageId],
            (err, rows) => {
              if (err) {
                console.error(`Error fetching message ${messageId}:`, err.stack);
                return;
              }
              const message = rows[0];
              if (message) {
                if (users[message.sender]) io.to(users[message.sender].socketId).emit("messageRead", { messageId, read_at });
                if (users[message.recipient]) io.to(users[message.recipient].socketId).emit("messageRead", { messageId, read_at });
              }
            }
          );
        }
      }
    );
  });

  socket.on("disconnect", () => {
    let disconnectedUserId = null;
    for (let userId in users) {
      if (users[userId].socketId === socket.id) {
        disconnectedUserId = userId;
        delete users[userId];
        activeUsers.delete(userId);
        break;
      }
    }

    if (disconnectedUserId) {
      const activeRiders = Array.from(activeUsers).filter((id) => users[id]?.role === "rider");
      const activeClients = Array.from(activeUsers).filter((id) => users[id]?.role === "client");
      io.emit("activeRiders", activeRiders);
      io.emit("activeClients", activeClients);
    }
  });
});

server.listen(5000, () => console.log("Server running on port 5000"));