import { CookieOptions, Request, Response } from "express";
import { config } from "../config";
import * as authService from "../services/auth.service";

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: config.cookieSecure,
  sameSite: "strict",
  path: "/",
};

export async function login(req: Request, res: Response) {
  const { email, password } = req.body ?? {};
  const { token, user } = await authService.login(email, password);
  res
    .cookie(authService.AUTH_COOKIE, token, {
      ...cookieOptions,
      maxAge: authService.TOKEN_TTL_MS,
    })
    .json({ user });
}

export function logout(_req: Request, res: Response) {
  res.clearCookie(authService.AUTH_COOKIE, cookieOptions).status(204).end();
}
