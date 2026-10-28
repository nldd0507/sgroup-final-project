export const sendSuccess = (res, statusCode, message, data)  => {
    const body = {success: true, message};
    if(data !== undefined && data !==null) body.data = data;
    return res.status(statusCode).json(body);
}