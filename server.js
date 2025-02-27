const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();
const mysql = require("mysql");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

const pHost = process.env.PUBLIC_HOST;

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: pHost, credentials: true } });

app.use(cors({ origin: pHost, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "client", "dist")));

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
  if (err) {
    console.error("Database connection error:", err);
  } else {
    console.log("Connected to database");
  }
});

function getAllUsers() {
  return new Promise((resolve, reject) => {
    db.query("SELECT userId, role FROM users", (err, results) => {
      if (err) {
        reject(err);
      } else {
        const users = results.map((row) => ({ userId: row.userId, role: row.role }));
        resolve(users);
      }
    });
  });
}

let users = {}; // Store users with their socket IDs and roles
let activeUsers = new Set();

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

io.on("connection", (socket) => {
  console.log(`New connection from socket ID: ${socket.id}`);

  socket.on("join", async ({ userId, role }) => {
    console.log(`User ${userId} with role ${role} attempting to join`);
    if (!userId || !role) {
      console.error(`Invalid join data for socket ${socket.id}: userId=${userId}, role=${role}`);
      return;
    }

    // Update users and activeUsers
    users[userId] = { socketId: socket.id, role };
    activeUsers.add(userId);
    console.log(`Added ${userId} to activeUsers. Current activeUsers: ${Array.from(activeUsers)}`);

    // Load messages for the joining user
    db.query(
      "SELECT sender, recipient, message, timestamp FROM messages WHERE sender = ? OR recipient = ? ORDER BY timestamp ASC",
      [userId, userId],
      (err, results) => {
        if (err) {
          console.error(`Error fetching messages for ${userId}:`, err);
        } else {
          console.log(`Fetched ${results.length} messages for ${userId}:`, results);
          socket.emit("loadMessages", results);
        }
      }
    );

    try {
      const allUsers = await getAllUsers();
      const activeAdmins = Array.from(activeUsers).filter((id) => users[id]?.role === "admin");
      const activeUsersForAdmin = Array.from(activeUsers).filter((id) => users[id]?.role === "user");

      if (role === "admin") {
        const userList = allUsers.filter((u) => u.role === "user").map((u) => u.userId);
        socket.emit("allUsers", userList);
        io.emit("activeUsersForAdmin", activeUsersForAdmin); // Broadcast to all admins
        console.log(`Emitted to all admins: allUsers = ${userList}, activeUsersForAdmin = ${activeUsersForAdmin}`);
      } else {
        const adminList = allUsers.filter((u) => u.role === "admin").map((u) => u.userId);
        socket.emit("availableAdmins", adminList);
        io.emit("activeUsers", activeAdmins); // Broadcast to all users
        console.log(`Emitted to all users: availableAdmins = ${adminList}, activeUsers = ${activeAdmins}`);
      }

      // Broadcast updated active users to all clients
      io.emit("activeUsers", activeAdmins); // Update all users
      io.emit("activeUsersForAdmin", activeUsersForAdmin); // Update all admins
    } catch (err) {
      console.error(`Error fetching all users for ${userId}:`, err);
    }
  });

  socket.on("sendMessage", ({ sender, recipient, message }) => {
    console.log(`Message from ${sender} to ${recipient}: ${message}`);
    if (users[sender] && users[sender].role === "user" && users[recipient]?.role !== "admin") {
      console.log(`Blocked message from ${sender} to ${recipient} due to role restriction`);
      return;
    }

    const timestamp = new Date().toISOString();
    const newMessage = { sender, recipient, message, timestamp };

    db.query(
      "INSERT INTO messages (sender, recipient, message, timestamp) VALUES (?, ?, ?, ?)",
      [sender, recipient, message, timestamp],
      (err) => {
        if (err) console.error(`Error saving message from ${sender} to ${recipient}:`, err);
      }
    );

    if (users[recipient]) {
      io.to(users[recipient].socketId).emit("receiveMessage", newMessage);
      console.log(`Sent message to ${recipient} via socket ${users[recipient].socketId}: ${JSON.stringify(newMessage)}`);
    }

    if (users[sender]) {
      io.to(users[sender].socketId).emit("receiveMessage", newMessage);
      console.log(`Sent message to ${sender} via socket ${users[sender].socketId}: ${JSON.stringify(newMessage)}`);
    }
  });

  socket.on("disconnect", () => {
    console.log(`Socket ${socket.id} disconnected`);
    let disconnectedUserId = null;
    for (let userId in users) {
      if (users[userId].socketId === socket.id) {
        disconnectedUserId = userId;
        delete users[userId];
        activeUsers.delete(userId);
        console.log(`Removed ${userId} from activeUsers. Current activeUsers: ${Array.from(activeUsers)}`);
        break;
      }
    }

    if (disconnectedUserId) {
      const activeAdmins = Array.from(activeUsers).filter((id) => users[id]?.role === "admin");
      const activeUsersForAdmin = Array.from(activeUsers).filter((id) => users[id]?.role === "user");
      io.emit("activeUsers", activeAdmins); // Broadcast to all users
      io.emit("activeUsersForAdmin", activeUsersForAdmin); // Broadcast to all admins
      console.log(`Broadcasted updated active users: admins = ${activeAdmins}, users = ${activeUsersForAdmin}`);
    }
  });
});

server.listen(5000, () => console.log("Server running on port 5000"));