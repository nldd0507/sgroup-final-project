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

export const updateUserSchema = z
  .object({
    name: nameField.optional(),
    password: passwordField.optional(),
    role: roleField.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field (name, role, password) is required",
  });
