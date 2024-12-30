import express from "express";
import { signUp, login } from "../controller/auth.controller.js";
const authRouter = express.Router();

authRouter.post("/sign-up", signUp).post("/login", login);

export { authRouter };