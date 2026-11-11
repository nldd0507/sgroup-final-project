import { z } from "zod";

const dateField = (fieldName) =>
  z
    .string({
      error: `${fieldName} is required`,
    })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: `Invalid ${fieldName.toLowerCase()} format`,
    });

const assignmentFields = {
  title: z
    .string({
      error: "Title is required",
    })
    .trim()
    .min(1, "Title cannot be empty")
    .max(255),
  description: z.string().trim().max(2000).optional(),
  maximumScore: z
    .number({
      error: "Maximum score is required",
    })
    .positive("Maximum score must be > 0"),
  deadline: dateField("Deadline"),
};

// 1. Schema tạo bài tập
export const createAssignmentSchema = z.object({
  ...assignmentFields,
});

// 2. Schema cập nhật bài tập (các trường đều optional)
export const updateAssignmentSchema = z.object({
  title: assignmentFields.title.optional(),
  description: assignmentFields.description,
  maximumScore: assignmentFields.maximumScore.optional(),
  deadline: dateField("Deadline").optional(),
});

// 3. Schema nộp bài (Level 7: có content hoặc repositoryUrl)
export const submitAssignmentSchema = z
  .object({
    content: z.string().trim().max(5000).optional(),
    repositoryUrl: z
      .string()
      .trim()
      .url("Invalid repository URL format")
      .optional(),
  })
  .refine((data) => data.content || data.repositoryUrl, {
    message: "At least one of content or repositoryUrl must be provided",
  });

// 4. Schema chấm bài (Review)
export const reviewSubmissionSchema = z.object({
  score: z
    .number({
      error: "Score is required",
    })
    .min(0, "Score cannot be negative"),
  feedback: z.string().trim().max(2000).optional(),
});