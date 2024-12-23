import { prisma } from "../prisma.js";

const getMessages = async (req, res) => {
  try {
    const receiverId  = req.query.receiverId;
    const userId  = req.user.userId;
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

export { getMessages };
