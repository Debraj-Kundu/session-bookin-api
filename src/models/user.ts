import { Schema, model } from "mongoose";

export const EMAIL_RULE: [RegExp, string] = [
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  "email must be a valid email address",
];

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, "fullName is required"],
      trim: true,
      minlength: [2, "fullName must be at least 2 characters"],
      maxlength: [100, "fullName must be at most 100 characters"],
    },
    email: {
      type: String,
      required: [true, "email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [254, "email must be at most 254 characters"],
      match: EMAIL_RULE,
    },
    phone: {
      type: String,
      required: [true, "phone is required"],
      trim: true,
      match: [
        /^\+?[1-9]\d{6,14}$/,
        "phone must be 7-15 digits, optionally starting with +",
      ],
    },
    passwordHash: { type: String, required: true, select: false },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        delete ret.passwordHash;
        return ret;
      },
    },
  },
);

export const User = model("User", userSchema);
