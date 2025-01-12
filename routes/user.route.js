import express from "express";
import { getNonGroupUsers } from "../controller/user.controller.js";
const userRouter = express.Router();

userRouter.get("/non-group", getNonGroupUsers);

export { userRouter };