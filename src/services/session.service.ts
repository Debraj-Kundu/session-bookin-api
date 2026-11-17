import { UpdateQuery, isObjectIdOrHexString } from "mongoose";
import { Session, SessionStatus, withTeacher } from "../models/session";
import { Teacher } from "../models/teacher";
import { FieldError, HttpError, invalid } from "../utils/http-error";
import { Pagination, paged } from "../utils/pagination";

const DAY_MS = 24 * 60 * 60 * 1000;
const ID_ERROR = "must be a valid 24-character hex id";

const isMissing = (value: unknown) =>
  value === undefined || value === null || value === "";

function toDate(value: unknown) {
  return typeof value === "string" || typeof value === "number"
    ? new Date(value)
    : new Date(NaN);
}

function dateError(field: string, value: unknown, date: Date) {
  if (isMissing(value)) return `${field} is required`;
  if (isNaN(date.getTime()))
    return `${field} must be an ISO 8601 date string or a timestamp in milliseconds`;
  return null;
}

async function transition(
  id: string,
  from: SessionStatus,
  update: UpdateQuery<unknown>,
  ownerId?: string,
) {
  if (!isObjectIdOrHexString(id))
    throw invalid([{ field: "id", message: `id ${ID_ERROR}` }]);
  const filter = {
    _id: id,
    status: from,
    ...(ownerId ? { userId: ownerId } : {}),
  };
  const session = await Session.findOneAndUpdate(filter, update, { new: true });
  if (session) return session;

  const current = await Session.findById(id);
  if (!current) throw new HttpError(404, "Session not found");
  if (ownerId && current.status === from)
    throw new HttpError(403, "Session is booked by another user");
  throw new HttpError(409, `Session is ${current.status}`);
}

export async function createSession({
  teacherId,
  startTime,
  endTime,
}: Record<string, unknown>) {
  const start = toDate(startTime);
  const end = toDate(endTime);
  const details: FieldError[] = [];

  if (isMissing(teacherId))
    details.push({ field: "teacherId", message: "teacherId is required" });
  else if (!isObjectIdOrHexString(teacherId))
    details.push({ field: "teacherId", message: `teacherId ${ID_ERROR}` });

  const startError = dateError("startTime", startTime, start);
  if (startError) details.push({ field: "startTime", message: startError });
  else if (start.getTime() <= Date.now())
    details.push({
      field: "startTime",
      message: "startTime must be in the future",
    });

  const endError = dateError("endTime", endTime, end);
  if (endError) details.push({ field: "endTime", message: endError });
  else if (!startError && end <= start)
    details.push({
      field: "endTime",
      message: "endTime must be after startTime",
    });

  if (details.length) throw invalid(details);
  if (!(await Teacher.exists({ _id: teacherId })))
    throw new HttpError(404, "Teacher not found");

  return Session.create({ teacherId, startTime: start, endTime: end });
}

export async function getAvailableSessions(
  dateTimestamp: unknown,
  pagination: Pagination,
) {
  if (typeof dateTimestamp !== "string" || dateTimestamp.trim() === "") {
    throw invalid([
      {
        field: "dateTimestamp",
        message: "dateTimestamp query parameter is required",
      },
    ]);
  }
  const dayStart = new Date(`${dateTimestamp}T00:00:00.000Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(dateTimestamp) ||
    isNaN(dayStart.getTime()) ||
    dayStart.toISOString().slice(0, 10) !== dateTimestamp
  ) {
    throw invalid([
      {
        field: "dateTimestamp",
        message: "dateTimestamp must be a date in YYYY-MM-DD format, e.g. 2026-11-18",
      },
    ]);
  }
  const dayEnd = new Date(dayStart.getTime() + DAY_MS);

  const [result] = await Session.aggregate([
    {
      $match: {
        status: "AVAILABLE",
        startTime: { $gte: dayStart, $lt: dayEnd },
      },
    },
    { $sort: { startTime: 1, _id: 1 } },
    {
      $facet: {
        items: [
          { $skip: pagination.skip },
          { $limit: pagination.limit },
          ...withTeacher,
        ],
        total: [{ $count: "n" }],
      },
    },
  ]);

  return paged(result.items, result.total, pagination);
}

export async function getSession(id: string) {
  if (!isObjectIdOrHexString(id))
    throw invalid([{ field: "id", message: `id ${ID_ERROR}` }]);
  const session = await Session.findById(id);
  if (!session) throw new HttpError(404, "Session not found");
  return session;
}

export function bookSession(id: string, userId: string) {
  return transition(id, "AVAILABLE", { status: "BOOKED", userId });
}

export function cancelSession(id: string, userId: string) {
  return transition(
    id,
    "BOOKED",
    { status: "AVAILABLE", userId: null },
    userId,
  );
}

export function completeSession(id: string, userId: string) {
  return transition(
    id,
    "BOOKED",
    { status: "COMPLETED", completedAt: new Date() },
    userId,
  );
}
