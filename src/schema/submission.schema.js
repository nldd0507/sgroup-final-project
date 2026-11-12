import { z } from "zod";

export const createSubmissionSchema = z
  .object({
    content: z.string().trim().min(1, "Content cannot be empty").max(10000).optional(),
    // Chỉ http/https: chặn javascript:, mailto:, ftp:... (BR-24)
    repositoryUrl: z
      .url({ protocol: /^https?$/, hostname: z.regexes.domain, error: "Repository URL is not valid" })
      .max(500)
      .optional(),
  })
  .refine((d) => d.content || d.repositoryUrl, {
    message: "Either content or repositoryUrl is required",
  });

// score <= maximumScore kiểm ở service vì maximumScore nằm trong DB (BR-26)
export const reviewSchema = z.object({
  score: z
    .number({ error: "Score must be a number" })
    .int("Score must be an integer")
    .min(0, "Score must be at least 0"),
  feedback: z.string().trim().max(5000).optional(),
});
