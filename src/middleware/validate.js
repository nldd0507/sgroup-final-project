import { z } from "zod";

export const validate = (schema) => {
  return (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};

// 2. Schema Đăng nhập 
export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email("Email is not valid"),

  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters"),
});

export const createUserSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .trim()
    .min(2, "Name must be between 2 and 50 characters")
    .max(50, "Name must be between 2 and 50 characters"),

  email: z
    .email({ message: "Email is not valid" })
    .trim(),

  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters"),

  role: z
    .enum(["ADMIN", "MEMBER"], {
      errorMap: () => ({ message: "Role must be ADMIN or MEMBER" }),
    })
    .optional(),
});

// 4. Schema Cập nhật User
export const updateUserSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be between 2 and 50 characters")
      .max(50, "Name must be between 2 and 50 characters")
      .optional(),

    email: z
        .email({ message: "Email is not valid" })
        .trim(),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .optional(),

    role: z
      .enum(["ADMIN", "MEMBER"], {
        errorMap: () => ({ message: "Role must be ADMIN or MEMBER" }),
      })
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "At least one field must be provided for update",
    }
  );
export const refreshTokenRules = z.object({
  refreshToken: z.string().min(1, "RefreshToken is required"),
});

export const createLessonSchema = z.object({
  title: z.string({ required_error: "Title is required" }).min(1),
  content: z.string().optional().default(""),
  order_no: z.number({ required_error: "order_no is required" }).int().positive(),
});

export const updateLessonSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  order_no: z.number().int().positive().optional(),
});