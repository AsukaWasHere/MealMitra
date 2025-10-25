// server.js
import dotenv from "dotenv";
dotenv.config(); // Moved to the top!

import express from "express";
import http from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import listingRoutes from "./routes/listingRoutes.js";
import aiRoutes from "./routes/aiRoutes.js"; // <-- ADD THIS LINE

const app = express();
app.use(cors());
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: "*", // or specify your frontend origin
    methods: ["GET", "POST"],
  },
});

// Store connected users { userId: socketId }
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  // When user logs in, register them
  socket.on("registerUser", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`📡 User ${userId} registered with socket ${socket.id}`);
  });

  // When user disconnects
  socket.on("disconnect", () => {
    for (let [key, value] of onlineUsers.entries()) {
      if (value === socket.id) onlineUsers.delete(key);
    }
    console.log("❌ User disconnected:", socket.id);
  });
});

// Export io so controllers can emit events
export { io, onlineUsers };

// MongoDB connection
mongoose
  .connect(process.env.DATABASE_URL) // This should now work correctly
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/ai", aiRoutes); // <-- AND ADD THIS LINE

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));