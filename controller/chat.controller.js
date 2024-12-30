import { prisma } from "../prisma.js";

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
      },
      select: {
        id: true,
      },
    });

    const allGroupChats = await prisma.groups.findMany({
      where: {
        GroupMembers: {
          some: {
            memberId: currentUser,
          },
        },
      },
      select: {
        id: true,
        name: true,
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
    return res.status(500).send(e);
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
      data: messages
    })
  } catch (error) {}
};

export { getPersonalMessages as getMessages, getAllChats, getGroupMessages };
