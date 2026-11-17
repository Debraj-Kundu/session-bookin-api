import { Router } from "express";
import * as userController from "../controllers/user.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { methodNotAllowed } from "../middlewares/http.middleware";

export const userRouter = Router();

userRouter
  .route("/")
  .post(userController.createUser)
  .all(methodNotAllowed("POST"));
userRouter
  .route("/:id")
  .get(requireAuth, userController.getUser)
  .all(methodNotAllowed("GET"));
userRouter
  .route("/:id/sessions")
  .get(requireAuth, userController.getUserSessions)
  .all(methodNotAllowed("GET"));
