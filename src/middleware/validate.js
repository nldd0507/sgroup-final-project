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

const emailField = z
  .string({ error: "Email is required" })
  .trim()
  .pipe(z.email({ error: "Email is not valid" }));

const roleField = z.enum(["ADMIN", "MEMBER"], { error: "Role must be ADMIN or MEMBER" });

// 1. Schema Đăng nhập
export const loginSchema = z.object({
  email: emailField,
  password: z
    .string({ error: "Password is required" })
    .min(1, "Password is required"),
});

// 2. Schema Tạo User (Admin)
export const createUserSchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .trim()
    .min(2, "Name must be between 2 and 50 characters")
    .max(50, "Name must be between 2 and 50 characters"),

  email: emailField,

  password: z
    .string({ error: "Password is required" })
    .min(8, "Password must be at least 8 characters"),

  role: roleField.optional(),
});

// 3. Schema Cập nhật User (Admin) — theo doc chỉ cho sửa name, role, password
export const updateUserSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be between 2 and 50 characters")
      .max(50, "Name must be between 2 and 50 characters")
      .optional(),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .optional(),

    role: roleField.optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: "At least one field (name, password, role) is required" }
  );
