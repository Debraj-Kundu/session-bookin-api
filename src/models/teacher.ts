import { Schema, model } from "mongoose";
import { EMAIL_RULE } from "./user";

const teacherSchema = new Schema(
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
      lowercase: true,
      trim: true,
      maxlength: [254, "email must be at most 254 characters"],
      match: EMAIL_RULE,
    },
    specialization: {
      type: String,
      required: [true, "specialization is required"],
      trim: true,
      minlength: [2, "specialization must be at least 2 characters"],
      maxlength: [100, "specialization must be at most 100 characters"],
    },
    experience: {
      type: Number,
      required: [true, "experience is required"],
      min: [0, "experience must be at least 0 years"],
      max: [60, "experience must be at most 60 years"],
    },
  },
  { timestamps: true, versionKey: false },
);

export const Teacher = model("Teacher", teacherSchema);
