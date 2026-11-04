import { z } from "zod";

const nameField = z
  .string({ error: "Name is required" })
  .trim()
  .min(2, "Name must be between 2 and 50 characters")
  .max(50, "Name must be between 2 and 50 characters");

const emailField = z
  .string({ error: "Email is required" })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Email is not valid" }));

const passwordField = z
  .string({ error: "Password is required" })
  .min(8, "Password must be least 8 characters");

const roleField = z.enum(["ADMIN", "MEMBER"], { error: "Role must be  ADMIN or MEMBER" });

export const createUserSchema = z.object({
  name: nameField,
  email: emailField,
  password: passwordField,
  role: roleField.default("MEMBER"),
});

export const userIdParamSchema = z.object({
  id: z.coerce
    .number({ error: "User id must be a number" })
    .int("User id must be an integer")
    .positive("User id must be positive")
    .max(2_147_483_647, "User id is out of range"),
});

export const updateUserSchema = z
  .object({
    name: nameField.optional(),
    password: passwordField.optional(),
    role: roleField.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field (name, role, password) is required",
  });
