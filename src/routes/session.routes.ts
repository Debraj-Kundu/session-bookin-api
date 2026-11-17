import { Router } from "express";
import * as sessionController from "../controllers/session.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { methodNotAllowed } from "../middlewares/http.middleware";

export const sessionRouter = Router();

sessionRouter.use(requireAuth);
sessionRouter
  .route("/")
  .post(sessionController.createSession)
  .all(methodNotAllowed("POST"));
sessionRouter
  .route("/available")
  .get(sessionController.getAvailableSessions)
  .all(methodNotAllowed("GET"));
sessionRouter
  .route("/:id")
  .get(sessionController.getSession)
  .all(methodNotAllowed("GET"));
sessionRouter
  .route("/:id/book")
  .post(sessionController.bookSession)
  .all(methodNotAllowed("POST"));
sessionRouter
  .route("/:id/cancel")
  .post(sessionController.cancelSession)
  .all(methodNotAllowed("POST"));
sessionRouter
  .route("/:id/complete")
  .patch(sessionController.completeSession)
  .all(methodNotAllowed("PATCH"));
