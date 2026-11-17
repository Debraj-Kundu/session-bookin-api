import { RequestHandler } from "express";
import { AUTH_COOKIE, verifyToken } from "../services/auth.service";
import { HttpError } from "../utils/http-error";

declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

function readCookie(header: string | undefined, name: string) {
  return header
    ?.split(/;\s*/)
    .find((pair) => pair.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const token = readCookie(req.headers.cookie, AUTH_COOKIE);
  if (!token) throw new HttpError(401, "Not authenticated");
  req.userId = verifyToken(token);
  next();
};
