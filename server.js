import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { authRouter } from "./routes/auth.route.js";
import { userRouter } from "./routes/user.route.js";
import { verifyUser } from "./middlewares/auth.middleware.js";
import { prisma } from "./prisma.js";
import { chatRouter } from "./routes/chat.route.js";
import { groupchatRouter } from "./routes/groupchat.route.js";

const app = express();

// Middleware for JSON parsing
app.use(express.json());

// Define routes
app
  .use("/auth", authRouter)
  .use("/users", verifyUser, userRouter)
  .use("/chats", verifyUser, chatRouter)
  .use("/group-chat", verifyUser, groupchatRouter);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Store active user connections
const activeConnections = {};
const activeRooms = {};
// Handle Socket.IO connections
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Create a user connection
  socket.on("create-connection", (userId) => {
    console.log("Created a connection for user:", userId);
    activeConnections[userId] = socket.id;
  });

  // Typing indicator
  socket.on("typing", ({ user, typing }) => {
    const targetSocketId = activeConnections[user];
    if (targetSocketId) {
      socket.to(targetSocketId).emit("typing", { typing });
    }
  });

  // Send a message
  socket.on("send-message", async (message, callback) => {
    try {
      const { msg, receiverId, senderId } = message;

      // Save message to database
      const savedMessage = await prisma.message.create({
        data: {
          messageContent: msg,
          senderId,
          receiverId,
        },
      });

      const enrichedMessage = {
        ...message,
        timestamp: savedMessage.createdAt,
        msgId: savedMessage.id,
      };

      callback({
        sent: 1,
        timestamp: savedMessage.createdAt,
        msgId: savedMessage.id,
      });
      console.log("Message sent from", senderId, "to", receiverId);

      // Deliver message to receiver if online
      const receiverSocketId = activeConnections[receiverId];
      if (receiverSocketId) {
        socket.to(receiverSocketId).emit("receive-message", enrichedMessage);

        await prisma.message.update({
          where: { id: savedMessage.id },
          data: { status: "delivered" },
        });

        // Notify sender about delivery
        io.to(activeConnections[senderId]).emit("message-status", {
          id: savedMessage.id,
          status: "delivered",
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      callback(0);
    }
  });

  // Mark messages as seen
  socket.on("message-seen", async ({ senderId, viewerId }) => {
    try {
      console.log(
        "Marking messages as seen for sender:",
        senderId,
        "by viewer:",
        viewerId
      );

      await prisma.message.updateMany({
        where: {
          senderId,
          receiverId: viewerId,
          status: { not: "seen" },
        },
        data: { status: "seen" },
      });

      io.to(activeConnections[senderId]).emit("messages-seen", {});
    } catch (error) {
      console.error("Error marking messages as seen:", error);
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);

    for (const [userId, socketId] of Object.entries(activeConnections)) {
      if (socketId === socket.id) {
        delete activeConnections[userId];
        console.log(`Removed user ${userId} from active connections.`);
        break;
      }
    }
  });

  // Joining a group
  socket.on("join-group", async (payload) => {
    const { groupId, userId } = payload;
    console.log(`User ${userId} joining room ${groupId}`);

    socket.join(activeRooms[groupId]);
    if (!activeRooms[groupId].includes(userId)) {
      activeRooms[groupId].push(userId);
    }
    console.log(`Active Rooms:`, activeRooms);
  });
  // Send a group message
  socket.on("send-group-message", async (payload, callback) => {
    try {
      const { content, senderId, groupId } = payload;

      // Save the message in the database
      const message = await prisma.groupMessages.create({
        data: {
          groupId,
          senderId,
          content,
        },
      });

      if (message) {
        // Broadcast the message to all users in the room
        io.to(groupId).emit("receive-group-messages", message);

        // Acknowledge the sender
        callback({ sent: 1, timestamp: message.createdAt, msgId: message.id });
      } else {
        console.error("Failed to create group message in the database.");
        callback({ sent: 0 });
      }
    } catch (error) {
      console.error("Error in send-group-message:", error);
      callback({ sent: 0 });
    }
  });
});

// Start the server
const PORT = 8080;
httpServer.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
