import express from "express";
import { createGroup } from "../controller/groupchat.controller.js";
const groupchatRouter = express.Router();

groupchatRouter.post("/", createGroup);

export { groupchatRouter };
