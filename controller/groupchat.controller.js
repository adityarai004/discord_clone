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
            groupId: createdGroup.id
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



export { createGroup };
