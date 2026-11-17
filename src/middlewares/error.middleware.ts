import { ErrorRequestHandler, RequestHandler } from "express";
import mongoose from "mongoose";
import { HttpError, fieldErrors, invalid } from "../utils/http-error";

export const notFound: RequestHandler = () => {
  throw new HttpError(404, "Route not found");
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
  if (
    err instanceof mongoose.Error.ValidationError ||
    err instanceof mongoose.Error.CastError
  ) {
    err = invalid(fieldErrors(err));
  } else if (err?.type === "entity.parse.failed") {
    err = invalid([
      {
        field: "body",
        message: `Request body must be valid JSON: ${err.message}`,
      },
    ]);
  } else if (err?.type === "entity.too.large") {
    err = new HttpError(413, "Request body must be at most 100kb");
  }
  if (res.headersSent) {
    next(err);
  } else if (err instanceof HttpError) {
    res
      .status(err.status)
      .json({
        error: err.message,
        ...(err.details && { details: err.details }),
      });
  } else if (err?.code === 11000) {
    res
      .status(409)
      .json({
        error: `${Object.keys(err.keyValue ?? {}).join(", ")} already exists`,
      });
  } else if (err?.expose && typeof err.status === "number") {
    res.status(err.status).json({ error: err.message });
  } else {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};
