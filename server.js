import express from "express";
import { createServer } from "http"; // Required for integrating with Socket.IO
import { Server } from "socket.io";
import jwt from "jsonwebtoken"; // Use to validate the token
import { authRouter } from "./routes/auth.route.js";
import { userRouter } from "./routes/user.route.js";
import { verifyUser } from "./middlewares/auth.middleware.js";
import { prisma } from "./prisma.js";
import { chatRouter } from "./routes/chat.route.js";

const app = express();

// Middleware for JSON parsing
app.use(express.json());

// Define routes
app
  .use("/auth", authRouter)
  .use("/users", verifyUser, userRouter)
  .use("/chats", verifyUser, chatRouter);
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.IO with the HTTP server
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Adjust this to specify allowed origins in production
    methods: ["GET", "POST"],
  },
});

// Middleware for token validation during handshake
// io.use((socket, next) => {
//   const token = socket.handshake.headers?.access_token; // Get the token from handshake auth
//   if (!token) {
//     return next(new Error("Authentication error: Token not provided"));
//   }

//   try {
//     const user = jwt.verify(token, process.env.JWT_SECRET); // Replace with your actual secret key
//     socket.user = user; // Attach user data to the socket instance
//     next();
//   } catch (err) {
//     console.error("Authentication error:", err.message);
//     return next(new Error("Authentication error: Invalid token"));
//   }
// });

const obj = {};

// Set up Socket.IO event handling
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id, "User ID:");

  // Register the user's socket ID for future communication
  socket.on("create-connection", (userId) => {
    console.log("Created a connection:", socket.id);
    obj[userId] = socket.id;
  });

  // Listen for a custom event from the client
  socket.on("send-message", async (message, callback) => {
    const { msg, receiverId, senderId } = message;
    // Save message to the database
    const sentMsg = await prisma.message.create({
      data: {
        messageContent: msg,
        senderId: senderId,
        receiverId: receiverId,
      },
    });

    if (sentMsg) {
      callback(1);
      console.log("Sending message:", msg, "to", receiverId, "from", senderId);
      // Send the message to the receiver if connected
      socket.to(obj[receiverId]).emit("receive-message", message);
    } else {
      callback(0);
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);

    // Clean up user from the connection map
    for (const [userId, socketId] of Object.entries(obj)) {
      if (socketId === socket.id) {
        delete obj[userId];
        console.log(`Removed user ${userId} from active connections.`);
        break;
      }
    }

    // Notify other clients about the disconnection
    io.emit("user-disconnected", { id: socket.id });
  });
});

// Start the server
const PORT = 8080;
httpServer.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
