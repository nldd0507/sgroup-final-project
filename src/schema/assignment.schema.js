import { z } from "zod";

const fields = {
  title: z
    .string({
      error: "Title is required",
    })
    .trim()
    .min(2, "Title must be at least 2 characters")
    .max(200),
  description: z.string().trim().max(5000).optional(),
  deadline: z.iso.datetime({ error: "Deadline must be an ISO 8601 datetime" }),
  maximumScore: z
    .number({ error: "Maximum score must be a number" })
    .int("Maximum score must be an integer")
    .positive("Maximum score must be greater than 0"),
};

export const createAssignmentSchema = z.object(fields);

export const updateAssignmentSchema = z
  .object({
    title: fields.title.optional(),
    description: fields.description,
    deadline: fields.deadline.optional(),
    maximumScore: fields.maximumScore.optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "At least one field is required" });
