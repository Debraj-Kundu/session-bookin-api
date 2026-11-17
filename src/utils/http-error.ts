import mongoose from 'mongoose';

export type FieldError = { field: string; message: string };

export class HttpError extends Error {
  constructor(public status: number, message: string, public details?: FieldError[]) {
    super(message);
  }
}

export function invalid(details: FieldError[]) {
  return new HttpError(400, 'Validation failed', details);
}

export function fieldErrors(err: mongoose.Error.ValidationError | mongoose.Error.CastError | null): FieldError[] {
  if (!err) return [];
  const errors = err instanceof mongoose.Error.CastError ? [err] : Object.values(err.errors);
  return errors.map((e) => ({
    field: e.path,
    message: e instanceof mongoose.Error.CastError ? `${e.path} has an invalid type` : e.message,
  }));
}
