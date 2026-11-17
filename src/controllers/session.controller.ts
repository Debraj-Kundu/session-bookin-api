import { Request, Response } from "express";
import * as sessionService from "../services/session.service";
import { parsePagination } from "../utils/pagination";

export async function createSession(req: Request, res: Response) {
  const session = await sessionService.createSession(req.body ?? {});
  res.status(201).location(`/sessions/${session.id}`).json(session);
}

export async function getSession(req: Request<{ id: string }>, res: Response) {
  res.json(await sessionService.getSession(req.params.id));
}

export async function getAvailableSessions(req: Request, res: Response) {
  res.json(
    await sessionService.getAvailableSessions(
      req.query.dateTimestamp,
      parsePagination(req.query),
    ),
  );
}

export async function bookSession(req: Request<{ id: string }>, res: Response) {
  res.json(await sessionService.bookSession(req.params.id, req.userId));
}

export async function cancelSession(
  req: Request<{ id: string }>,
  res: Response,
) {
  res.json(await sessionService.cancelSession(req.params.id, req.userId));
}

export async function completeSession(
  req: Request<{ id: string }>,
  res: Response,
) {
  res.json(await sessionService.completeSession(req.params.id, req.userId));
}
