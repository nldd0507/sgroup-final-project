import { z } from "zod";

const fields = {
  title: z
    .string({ error: "Title is required" })
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be at most 200 characters"),
  content: z.string({ error: "Content must be a string" }),
  order: z
    .number({ error: "Order must be a number" })
    .int("Order must be an integer")
    .positive("Order must be greater than 0"),
};

export const createLessonSchema = z.object({
  title: fields.title,
  content: fields.content.default(""),
  order: fields.order,
});

export const updateLessonSchema = z
  .object({
    title: fields.title.optional(),
    content: fields.content.optional(),
    order: fields.order.optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "At least one field (title, content, order) is required",
  });
