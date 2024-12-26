import express from "express";
import { createServer } from "http"; // Required for integrating with Socket.IO
import { Server } from "socket.io";
import { authRouter } from "./routes/auth.route.js";
import { userRouter } from "./routes/user.route.js";
import { verifyUser } from "./middlewares/auth.middleware.js";
import { prisma } from "./prisma.js";
import { chatRouter } from "./routes/chat.route.js";
import { equal } from "assert";
import { send } from "process";
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

  socket.on("typing", async (payload) => {
    const { user, typing } = payload;
    socket.to(obj[user]).emit("typing", { typing: typing });
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
    message["timestamp"] = sentMsg.createdAt;
    message["msgId"] = sentMsg.id;
    if (sentMsg) {
      callback({ sent: 1, timestamp: sentMsg.createdAt, msgId: sentMsg.id });
      console.log("Sending message:", msg, "to", receiverId, "from", senderId);
      // Send the message to the receiver if connected
      if (obj[receiverId]) {
        socket.to(obj[receiverId]).emit("receive-message", message);
        const updated = await prisma.message.update({
          where: {
            id: sentMsg.id,
          },
          data: {
            status: "delivered",
          },
        });
        if (updated) {
          console.log("Message updated", updated);
        } else {
          console.log("message didnt updated");
        }
        console.log("sending message status delivered to", obj[senderId]);
        io.to(obj[senderId]).emit("message-status", {
          id: sentMsg.id,
          status: "delivered",
        });
      }
    } else {
      console.log("Cannot deliver the message");
      callback(0);
    }
  });

  socket.on("message-seen", async (payload) => {
    const { senderId, viewerId } = payload;
    console.log("Message Seen Sender ID", senderId, "Viewer Id", viewerId);
    const result = await prisma.message.updateMany({
      where: {
        AND: [
          {
            senderId: senderId,
            receiverId: viewerId,
            status: { not: "seen" },
          },
        ],
      },

      data: {
        status: "seen",
      },
    });
    console.log("Matching Messages:", result);

    // const rowsUpdated = await prisma.message.updateMany({
    //   where: {
    //     senderId: senderId,
    //     receiverId: receiverId,
    //     status: { not: "seen" }, // Ensure only messages not already seen are targeted
    //   },
    //   data: {
    //     status: "seen",
    //   },
    // });

    // if (rowsUpdated) {
    //   console.log("Rows Updated", rowsUpdated);
    // } else {
    //   console.log("Rows not updated");
    // }

    io.to(obj[senderId]).emit("messages-seen", {});
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
