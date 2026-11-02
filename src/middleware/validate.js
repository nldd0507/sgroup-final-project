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

export const registerSchema = z.object({
  name: z
    .string({ required_error: "Tên không được để trống" })
    .trim()
    .min(2, "Tên phải từ 2 ký tự trở lên")
    .max(50, "Tên tối đa 50 ký tự"),

  email: z
    .string({ required_error: "Email không được để trống" })
    .trim()
    .email("Email không đúng định dạng"),

  password: z
    .string({ required_error: "Mật khẩu không được để trống" })
    .min(8, "Mật khẩu phải có tối thiểu 8 ký tự"),

  role: z
    .enum(["ADMIN", "MEMBER"], {
      errorMap: () => ({ message: "Role chỉ được phép là ADMIN hoặc MEMBER" }),
    })
    .optional(),
});

// 2. Schema Đăng nhập 
export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email không được để trống" })
    .trim()
    .email("Email không đúng định dạng"),

  password: z
    .string({ required_error: "Mật khẩu không được để trống" })
    .min(8, "Mật khẩu phải có tối thiểu 8 ký tự"),
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
    .min(8, "Mật khẩu phải có tối thiểu 8 ký tự"),

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
      .min(2, "Tên phải từ 2 đến 50 ký tự")
      .max(50, "Tên phải từ 2 đến 50 ký tự")
      .optional(),

    email: z
        .email({ message: "Email is not valid" })
        .trim(),

    password: z
      .string()
      .min(8, "Mật khẩu mới phải có tối thiểu 8 ký tự")
      .optional(),

    role: z
      .enum(["ADMIN", "MEMBER"], {
        errorMap: () => ({ message: "Role chỉ được phép là ADMIN hoặc MEMBER" }),
      })
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "Cần cung cấp ít nhất một trường (name, email, password, role) để cập nhật",
    }
  );