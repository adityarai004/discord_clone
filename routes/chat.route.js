import express from "express";
import { getMessages } from "../controller/chat.controller.js";
const chatRouter = express.Router();

chatRouter.get("/dms", getMessages);

export { chatRouter };
