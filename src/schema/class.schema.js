import { z } from "zod";

const dateField = (label) => z.iso.date({ error: `${label} must be in YYYY-MM-DD format` });
const mentorIdField = z.coerce.number({ error: "Mentor id must be a number" }).int().positive();

const fields = {
  name: z
    .string({
      error: "Name is required",
    })
    .trim()
    .min(2)
    .max(150),
  description: z.string().trim().max(2000).optional(),
  startDate: dateField("Start date"),
  endDate: dateField("End date"),
  mentorId: mentorIdField,
};

export const createClassSchema = z.object(fields).refine((d) => d.endDate > d.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});

export const updateClassSchema = z
  .object({
    name: fields.name.optional(),
    description: fields.description,
    startDate: fields.startDate.optional(),
    endDate: fields.endDate.optional(),
    mentorId: fields.mentorId.optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "At least one field is required" });
