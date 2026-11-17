import express from "express";
import { errorHandler, notFound } from "./middlewares/error.middleware";
import { negotiateJson } from "./middlewares/http.middleware";
import { authRouter } from "./routes/auth.routes";
import { sessionRouter } from "./routes/session.routes";
import { userRouter } from "./routes/user.routes";

export const app = express();

app.use(negotiateJson);
app.use(express.json());
app.use("/auth", authRouter);
app.use("/users", userRouter);
app.use("/sessions", sessionRouter);
app.use(notFound);
app.use(errorHandler);
