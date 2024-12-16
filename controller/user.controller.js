import { prisma } from "../prisma.js";

const getAllUsers = async (req, res) => {
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

    const userIds = allUsers.map((user) => user.id);

    return res.status(200).send({
      status: true,
      message: "List Fetched",
      data: {
        userIds: userIds,
      },
    });
  } catch (error) {
    return res.status(500).send(e);
  }
};
export { getAllUsers };
