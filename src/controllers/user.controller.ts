import { Request, Response } from "express";
import * as userService from "../services/user.service";
import { parsePagination } from "../utils/pagination";

export async function createUser(req: Request, res: Response) {
  const user = await userService.createUser(req.body ?? {});
  res.status(201).location(`/users/${user.id}`).json(user);
}

export async function getUser(req: Request<{ id: string }>, res: Response) {
  res.json(await userService.getUser(req.params.id, req.userId));
}

export async function getUserSessions(
  req: Request<{ id: string }>,
  res: Response,
) {
  res.json(
    await userService.getUserSessions(
      req.params.id,
      req.userId,
      parsePagination(req.query),
    ),
  );
}
