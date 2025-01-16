import { prisma } from "../prisma.js";
import path from "path";
import fs from "fs";
const getPersonalMessages = async (req, res) => {
  try {
    const receiverId = req.query.receiverId;
    const userId = req.user.userId;
    console.log("Sender id", userId, "receiverId", receiverId);
    const count = await prisma.message.count({
      where: {
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
      },
    });
    const chats = await prisma.message.findMany({
      where: {
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
      },

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
};
