import { prisma } from "../prisma.js";

const getNonGroupUsers = async (req, res) => {
  try {
    const currentUser = req.user.userId;
    const groupId = req.query.groupId;
    console.log("current user non group", currentUser);
    const allUsers = await prisma.user.findMany({
      where: {
        id: {
          not: currentUser,
        },
        AND: {
          GroupMembers: {
            none: {
              groupId: groupId
            }
          }
        }
      },
      select: {
        id: true
      }
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
    return res.status(500).send({ message: error.message });
  }
};
export { getNonGroupUsers };
