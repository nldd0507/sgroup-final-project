import * as authService from "../service/auth.service.js";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/responseHelper.js";

export const register = catchAsync(async (req, res) => {
  const newUser = await authService.register(req.body);
  return sendSuccess(res, 201, "Register successfully!", newUser);
});

export const login = catchAsync(async (req, res) => {
  const result = await authService.login(req.body);
  return sendSuccess(res, 200, "Login successfully!", result);
});

export const refreshToken = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;
  const result = await authService.refreshTokenService(refreshToken);
  return sendSuccess(res, 200, "New Access Token generated successfully!", result);
});

export const getMe = catchAsync(async (req, res) => {
  const currentUserId = req.user.sub || req.user.id;
  const userProfile = await authService.getMe(currentUserId);
  return sendSuccess(res, 200, "Get profile successfully!", userProfile);
});

export const logout = catchAsync(async (req, res) => {
  const currentUserId = req.user.sub || req.user.id;
  await authService.logout(currentUserId);
  return sendSuccess(res, 200, "Logout successfully!");
});