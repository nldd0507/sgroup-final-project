import ApiError from "../core/error.response.js";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

const PG_ERRORS = {
    "23505": [409, "Dữ liệu đã tồn tại"],
    "23503": [409, "Dữ liệu liên quan không hợp lệ hoặc đang được sử dụng"],
    "23514": [400, "Dữ liệu vi phạm ràng buộc"],
    "22P02": [400, "Sai định dạng dữ liệu"],
};

const PRISMA_ERRORS = {
  "P2002": [409, "Dữ liệu đã tồn tại trong hệ thống"],
  "P2025": [404, "Không tìm thấy bản ghi yêu cầu"],
  "P2003": [409, "Ràng buộc khóa ngoại không hợp lệ"],
};

const errorHandler = (err, req, res, next) => {
    console.error(`[Error] ${err.name}: ${err.message}`);

    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({ success: false, message: err.message });
    }

    if (err instanceof ZodError) {
        const message = err.issues.map((e) => e.message).join(", ");
        return res.status(400).json({ success: false, message });
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (PRISMA_ERRORS[err.code]) {
            const [status, message] = PRISMA_ERRORS[err.code];
            return res.status(status).json({ success: false, message });
        }
    }

    if (err.code && PG_ERRORS[err.code]) {
        const [status, message] = PG_ERRORS[err.code];
        return res.status(status).json({ success: false, message });
    }

    return res.status(500).json({ success: false, message: "Internal Server Error" });
};

export default errorHandler;