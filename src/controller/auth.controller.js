import * as authService from "../service/auth.service.js";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/responseHelper.js";

export const login = catchAsync(async (req, res) => {
  const result = await authService.login(req.body);
  return sendSuccess(res, 200, "Login successfully!", result);
});

export const getMe = catchAsync(async (req, res) => {
  const currentUserId = req.user.sub;
  const userProfile = await authService.getMe(currentUserId);
  return sendSuccess(res, 200, "Get profile successfully!", userProfile);
});