import { RequestHandler } from "express";
import { HttpError } from "../utils/http-error";

export const negotiateJson: RequestHandler = (req, _res, next) => {
  const hasContent =
    Number(req.headers["content-length"]) > 0 ||
    req.headers["transfer-encoding"] !== undefined;
  if (hasContent && !req.is("application/json"))
    throw new HttpError(415, "Content-Type must be application/json");
  if (!req.accepts("application/json"))
    throw new HttpError(406, "Accept must allow application/json");
  next();
};

export function methodNotAllowed(...allowed: string[]): RequestHandler {
  return (_req, res) => {
    res.set("Allow", allowed.join(", "));
    throw new HttpError(
      405,
      `Method not allowed. Allowed: ${allowed.join(", ")}`,
    );
  };
}
