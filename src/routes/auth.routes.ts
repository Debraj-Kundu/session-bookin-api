import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { methodNotAllowed } from "../middlewares/http.middleware";

export const authRouter = Router();

authRouter
  .route("/login")
  .post(authController.login)
  .all(methodNotAllowed("POST"));
authRouter
  .route("/logout")
  .post(authController.logout)
  .all(methodNotAllowed("POST"));
