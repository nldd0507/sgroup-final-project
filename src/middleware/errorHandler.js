import ApiError from "../core/error.response.js";

const PG_ERRORS = {
    "23505": [409, "Dữ liệu đã tồn tại"],
    "23503": [409, "Dữ liệu liên quan không hợp lệ hoặc đang được sử dụng"],
    "23514": [400, "Dữ liệu vi phạm ràng buộc"],
    "22P02": [400, "Sai định dạng dữ liệu"],
};

const errorHandler = (err, req, res, next) => {
    console.error(`[Error] ${err.name}: ${err.message}`);

    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({ success: false, message: err.message });
    }

    if (err.code && PG_ERRORS[err.code]) {
        const [status, message] = PG_ERRORS[err.code];
        return res.status(status).json({ success: false, message });
    }

    return res.status(500).json({ success: false, message: "Internal Server Error" });
};

export default errorHandler;