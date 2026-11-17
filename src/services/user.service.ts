import { Types, isObjectIdOrHexString } from "mongoose";
import { Session, withTeacher } from "../models/session";
import { User } from "../models/user";
import { HttpError, fieldErrors, invalid } from "../utils/http-error";
import { Pagination, paged } from "../utils/pagination";
import { hashPassword } from "./auth.service";

function passwordError(password: unknown) {
  if (typeof password !== "string" || password === "")
    return "password is required";
  if (password.length < 8) return "password must be at least 8 characters";
  if (password.length > 128) return "password must be at most 128 characters";
  return null;
}

export async function createUser({
  fullName,
  email,
  phone,
  password,
}: Record<string, unknown>) {
  const user = new User({ fullName, email, phone });
  const details = fieldErrors(
    user.validateSync(["fullName", "email", "phone"]),
  );
  const pwError = passwordError(password);
  if (pwError) details.push({ field: "password", message: pwError });
  if (details.length) throw invalid(details);

  user.passwordHash = await hashPassword(password as string);
  return user.save();
}

function assertSelf(userId: string, requesterId: string) {
  if (!isObjectIdOrHexString(userId))
    throw invalid([
      { field: "id", message: "id must be a valid 24-character hex id" },
    ]);
  if (userId !== requesterId)
    throw new HttpError(403, "You can only access your own user");
}

export async function getUser(userId: string, requesterId: string) {
  assertSelf(userId, requesterId);
  const user = await User.findById(userId);
  if (!user) throw new HttpError(404, "User not found");
  return user;
}

export async function getUserSessions(
  userId: string,
  requesterId: string,
  pagination: Pagination,
) {
  assertSelf(userId, requesterId);
  if (!(await User.exists({ _id: userId })))
    throw new HttpError(404, "User not found");

  const { skip, limit } = pagination;
  const [result] = await Session.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(userId),
        status: { $in: ["BOOKED", "COMPLETED"] },
      },
    },
    {
      $facet: {
        upcoming: [
          { $match: { status: "BOOKED" } },
          { $sort: { startTime: 1, _id: 1 } },
          { $skip: skip },
          { $limit: limit },
          ...withTeacher,
        ],
        upcomingTotal: [{ $match: { status: "BOOKED" } }, { $count: "n" }],
        completed: [
          { $match: { status: "COMPLETED" } },
          { $sort: { completedAt: -1, _id: 1 } },
          { $skip: skip },
          { $limit: limit },
          ...withTeacher,
        ],
        completedTotal: [{ $match: { status: "COMPLETED" } }, { $count: "n" }],
      },
    },
  ]);

  return {
    upcoming: paged(result.upcoming, result.upcomingTotal, pagination),
    completed: paged(result.completed, result.completedTotal, pagination),
  };
}
