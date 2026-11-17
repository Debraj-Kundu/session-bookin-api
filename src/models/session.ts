import { PipelineStage, Schema, model } from "mongoose";

export type SessionStatus = "AVAILABLE" | "BOOKED" | "COMPLETED";

const sessionSchema = new Schema(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: ["AVAILABLE", "BOOKED", "COMPLETED"],
      default: "AVAILABLE",
    },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);

sessionSchema.index({ status: 1, startTime: 1 });
sessionSchema.index({ userId: 1, status: 1 });

export const Session = model("Session", sessionSchema);

export const withTeacher: PipelineStage.FacetPipelineStage[] = [
  {
    $lookup: {
      from: "teachers",
      localField: "teacherId",
      foreignField: "_id",
      as: "teacher",
      pipeline: [
        { $project: { fullName: 1, specialization: 1, experience: 1 } },
      ],
    },
  },
  { $unwind: "$teacher" },
];
