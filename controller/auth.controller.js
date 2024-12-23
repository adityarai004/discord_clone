import bcrypt from "bcrypt";
import { prisma } from "../prisma.js";
import jwt from "jsonwebtoken";
const signUp = async (req, res) => {
  try {
    console.log("req body ", req.body);
    const { userId, pwd } = req.body;
    if (!userId || !pwd) {
      return res.status(400).send("User ID or Password cannot be empty");
    }

    const userExist = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (userExist) {
      return res.status(409).send({
        status: false,
        message: "User already exists",
      });
    }
    const hash = await bcrypt.hash(pwd, 10);
    const user = await prisma.user.create({
      data: {
        id: userId,
        password: hash,
      },
    });

    const payload = { userId: userId };

    return res.status(201).send({
      status: true,
      message: "User created successfully",
      data: { user: user, authToken: generateToken(payload) },
    });
  } catch (e) {
    console.log("Error ", e);
    return res.status(500).send(e);
  }
};

const login = async (req, res) => {
  try {
    console.log("login req body ", req.body);
    const { userId, pwd } = req.body;
    if (!userId || !pwd) {
      return res
        .status(400)
        .send({
          status: false,
          message: "User ID or Password cannot be empty",
        });
    }
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user) {
      const hash = await bcrypt.hash(pwd, 10);
      const newUser = await prisma.user.create({
        data: {
          id: userId,
          password: hash,
        },
      });

      const payload = { userId: userId };

      return res.status(201).send({
        status: true,
        message: "User created successfully",
        data: { userId: newUser.id, authToken: generateToken(payload) },
      });
    }

    const passwordMatched = await bcrypt.compare(pwd, user.password);

    const payload = { userId: userId };
    if (passwordMatched) {
      console.log("Password MAtched");
      return res.status(200).send({
        status: true,
        message: "User Authenticated",
        data: {
          authToken: generateToken(payload),
          userId: user.id
        },
      });
    }

    return res.status(401).send({
      status: false,
      message: "Incorrect Password",
    });
  } catch (e) {
    console.log("Error occurred while login: ", e);
    return res.status(500).send(e);
  }
};

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" });
};

export { signUp, login };
