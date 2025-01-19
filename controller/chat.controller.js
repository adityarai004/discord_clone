import { prisma } from "../prisma.js";
import path from "path";
import fs from "fs";
const getPersonalMessages = async (req, res) => {
  try {
    const receiverId = req.query.receiverId;
    const timestamp = req.query.timestamp;
    const userId = req.user.userId;
    console.log("Sender id", userId, "receiverId", receiverId);
    console.log("Timestamp", timestamp);
    const whereClause = {
      OR: [
        {
          senderId: userId,
          receiverId: receiverId,
        },
        {
          senderId: receiverId,
          receiverId: userId,
        },
      ],
      AND: {
        createdAt: {
          gt: timestamp,
        },
      },
    };

    const count = await prisma.message.count({
      where: whereClause,
    });

    const chats = await prisma.message.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "asc",
      },
    });

    return res.status(200).send({
      success: true,
      message: "Messages retrived successfully",
      messageData: {
        total: count,
        messages: chats,
      },
    });
  } catch (e) {
    console.error("Cannot fetch messages", e);
    return res.status(500).send({
      success: false,
      message: e,
    });
  }
};

const getPersonalMessagesInRange = async (req, res) => {
  try {
      const { receiverId, startTime, endTime } = req.query;
      const userId = req.user.userId;

      console.log(
          "Fetching messages for range:",
          "userId:", userId,
          "receiverId:", receiverId,
          "startTime:", startTime,
          "endTime:", endTime
      );

      // Validate time parameters
      if (!startTime || !endTime) {
          return res.status(400).send({
              success: false,
              message: "Both startTime and endTime are required"
          });
      }

      // Build the where clause for both count and fetch
      const whereClause = {
          OR: [
              {
                  senderId: userId,
                  receiverId: receiverId,
              },
              {
                  senderId: receiverId,
                  receiverId: userId,
              },
          ],
          AND: {
              createdAt: {
                  gte: startTime,
                  lte: endTime
              }
          }
      };

      // Get count of messages in range
      const count = await prisma.message.count({
          where: whereClause
      });

      // Fetch messages in range
      const chats = await prisma.message.findMany({
          where: whereClause,
          orderBy: {
              createdAt: "asc",
          },
      });

      return res.status(200).send({
          success: true,
          message: "Messages retrieved successfully",
          messageData: {
              total: count,
              messages: chats,
              timeRange: {
                  start: startTime,
                  end: endTime
              }
          },
      });
  } catch (e) {
      console.error("Cannot fetch messages in range:", e);
      return res.status(500).send({
          success: false,
          message: e.message || "Internal server error"
      });
  }
};


const getAllChats = async (req, res) => {
  try {
    const currentUser = req.user.userId;

    const allUsers = await prisma.user.findMany({
      where: {
        NOT: {
          id: {
            equals: currentUser,
          },
        },
        AND: {
          isActive: true,
        },
      },
      select: {
        id: true,
      },
    });

    const allGroupChats = await prisma.groupMembers.findMany({
      where: {
        memberId: currentUser,
      },
      select: {
        groupId: true,
        group: {
          select: {
            name: true,
          },
        },
      },
    });

    const userIds = allUsers.map((user) => user.id);
    return res.status(200).send({
      status: true,
      message: "List Fetched",
      data: {
        userIds: userIds,
        groups: allGroupChats,
      },
    });
  } catch (error) {
    console.log("error", error);

    return res.status(500).send(error);
  }
};

const getGroupMessages = async (req, res) => {
  try {
    const groupId = req.query.groupId;

    const messages = await prisma.groupMessages.findMany({
      where: {
        groupId: groupId,
      },
    });

    return res.status(200).send({
      status: true,
      message: "List fetched successfully",
      data: messages,
    });
  } catch (error) {}
};

const uploadImage = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { image } = req.files;
    const { dmMessageId } = req.body;

    if (!image) {
      return res.status(400).send({
        status: false,
        message: "Image is required",
      });
    }

    const uploadDir = path.join(__dirname, "..", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }

    const fileName = `${Date.now()}-${image.name}`;
    const filePath = path.join(uploadDir, fileName);

    image.mv(filePath, async (err) => {
      if (err) {
        console.error("Error uploading image", err);
        return res.status(500).send({
          status: false,
          message: "Error uploading image",
        });
      }
    });

    const result = await prisma.message.update({
      where: {
        id: dmMessageId,
      },
      data: {
        status: "sent",
        media: {
          update: {
            where: {
              dmMessageId: dmMessageId,
            },
            data: {
              url: "https://localhost:8080/uploads/" + fileName,
            },
          },
        },
      },
    });

    return res.status(200).send({
      status: true,
      message: "Image uploaded successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error uploading image", error);
    return res.status(500).send({
      status: false,
      message: "Error uploading image",
    });
  }
};

export {
  getPersonalMessages as getMessages,
  getAllChats,
  getGroupMessages,
  uploadImage,
  getPersonalMessagesInRange
};
