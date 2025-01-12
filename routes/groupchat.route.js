import express from "express";
import { createGroup, joinGroup } from "../controller/groupchat.controller.js";
const groupchatRouter = express.Router();

groupchatRouter
    .post("/", createGroup)
    .post("/join-group", joinGroup);

export { groupchatRouter };
