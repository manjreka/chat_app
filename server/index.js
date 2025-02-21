const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Adjust frontend URL
    methods: ["GET", "POST"],
  },
});

app.use(cors());

const users = {}; // Stores connected users

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", (userId) => {
    users[userId] = socket.id;
    console.log(`${userId} joined with socket ID: ${socket.id}`);
  });

  socket.on("private-message", ({ senderId, receiverId, message }) => {
    const receiverSocketId = users[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("private-message", { senderId, message });
    }
  });

  socket.on("join-room", (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);
  });

  socket.on("group-message", ({ room, senderId, message }) => {
    io.to(room).emit("group-message", { senderId, message, room });
  });

  socket.on("broadcast", ({ senderId, message }) => {
    // socket.broadcast.emit("broadcast", { senderId, message }); // all except sender
    io.emit("broadcast", { senderId, message }); // send to all including sender
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    for (const user in users) {
      if (users[user] === socket.id) {
        delete users[user];
        break;
      }
    }
  });
});

server.listen(5000, () => {
  console.log("Server running on port 5000");
});
