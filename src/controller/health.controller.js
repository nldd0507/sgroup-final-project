import * as healthRepository from "../repository/health.repository.js"
import {sendSuccess} from "../utils/responseHelper.js"

export const check = (req, res) => {
    return sendSuccess(res,200,"Server is running");
}

export const checkDb = async (req, res) => {
    const serverTime = await healthRepository.getDbTime();
    return sendSuccess(res, 200, "Database is connected", {serverTime});
}