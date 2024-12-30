import express from "express";
import {
  getMessages,
  getAllChats,
  getGroupMessages,
} from "../controller/chat.controller.js";
const chatRouter = express.Router();

chatRouter
  .get("/messages", getMessages)
  .get("/group-messages", getGroupMessages)
  .get("/", getAllChats);

export { chatRouter };
