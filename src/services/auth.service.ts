import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { User } from "../models/user";
import { FieldError, HttpError, invalid } from "../utils/http-error";

export const AUTH_COOKIE = "token";
export const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: string,
  keylen: number,
) => Promise<Buffer>;

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = await scryptAsync(password, salt, 64);
  return `${salt}:${hash.toString("hex")}`;
}

async function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(":");
  const candidate = await scryptAsync(password, salt, 64);
  return timingSafeEqual(candidate, Buffer.from(hash, "hex"));
}

export function verifyToken(token: string) {
  let payload: string | jwt.JwtPayload;
  try {
    payload = jwt.verify(token, config.jwtSecret, { algorithms: ["HS256"] });
  } catch {
    throw new HttpError(401, "Invalid or expired token");
  }
  if (typeof payload === "string" || typeof payload.sub !== "string") {
    throw new HttpError(401, "Invalid or expired token");
  }
  return payload.sub;
}

export async function login(email: unknown, password: unknown) {
  const details: FieldError[] = [];
  if (typeof email !== "string" || email.trim() === "")
    details.push({ field: "email", message: "email is required" });
  if (typeof password !== "string" || password === "")
    details.push({ field: "password", message: "password is required" });
  if (
    details.length ||
    typeof email !== "string" ||
    typeof password !== "string"
  )
    throw invalid(details);
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select(
    "+passwordHash",
  );
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new HttpError(401, "Invalid credentials");
  }
  const token = jwt.sign({}, config.jwtSecret, {
    subject: user.id,
    expiresIn: TOKEN_TTL_MS / 1000,
    algorithm: "HS256",
  });
  return { token, user };
}
