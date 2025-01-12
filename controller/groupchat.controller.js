import { prisma } from "../prisma.js";

const createGroup = async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isActive: true },
    });

    if (!user || !user.isActive) {
      return res.status(403).send({
        status: false,
        message: "User is not active or does not exist.",
      });
    }

    const result = await prisma.$transaction(async (prisma) => {
      const createdGroup = await prisma.groups.create({
        data: {
          name: name,
          description: description,
          adminUserId: userId,
        },
      });
      if (createdGroup) {
        await prisma.groupMembers.create({
          data: {
            memberId: userId,
            groupId: createdGroup.id,
            role: "admin",
          },
        });

        await prisma.groupMessages.create({
          data: {
            content: `Group created by ${userId} on ${createdGroup.createdAt.getDate()}`,
            messageType: "system",
            groupId: createdGroup.id,
          },
        });
      }

      return createdGroup;
    });

    console.log("Admin inserted successfully", result);
    return res.status(201).send({
      status: true,
      message: "Group created successfullly",
      data: result,
    });
  } catch (error) {
    console.log("Error during group creation occurred", error);
    return res.status(500).send({
      status: false,
      message: `Internal server error ${error}`,
    });
  }
};

const joinGroup = async (req, res) => {
  try {
    const { userId, groupId } = req.body;
    const senderId = req.user.userId;
    console.log(`Sender ID ${senderId}`);
    if (!userId || !groupId) {
      return res.status(400).send({
        status: false,
        message: "UserID and group ID is required",
      });
    }
    const alreadyMember = await prisma.groupMembers.findFirst({
      where: {
        memberId: userId,
        groupId: groupId,
      },
    });

    if (alreadyMember) {
      return res.status(409).send({
        status: false,
        message: "This user is already a member of the group",
      });
    }

    const joined = await prisma.groupMembers.create({
      data: {
        groupId: groupId,
        memberId: userId,
      },
    });

    if (!joined) {
      return res.status(500).send({
        status: false,
        message: "Not able to invite the user",
      });
    }

    return res.status(201).send({
      status: true,
      message: "Added successfully",
      data: joined,
    });
  } catch (error) {
    console.error(`Join group error: ${error}`);
    return res.status(500).send({
      status: false,
      message: `Server error ${error.message}`,
    });
  }
};
export { createGroup, joinGroup };
