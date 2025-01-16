import express from "express";
import {
  getMessages,
  getAllChats,
  getGroupMessages,
  uploadImage
} from "../controller/chat.controller.js";
const chatRouter = express.Router();
import multer from "multer";

const upload = multer({ dest: 'uploads/' })

chatRouter
  .get("/messages", getMessages)
  .get("/group-messages", getGroupMessages)
  .get("/", getAllChats)
  .post("/upload-image", upload.single('image'), uploadImage);

export { chatRouter };
