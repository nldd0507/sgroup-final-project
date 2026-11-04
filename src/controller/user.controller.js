import { userIdParamSchema } from "../schema/user.schema.js";
import * as userService from "../service/user.service.js";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccess } from "../utils/responseHelper.js";

export const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);

  return sendSuccess(res, 201, "User created successfully", user);
});

export const getUsers = catchAsync(async (req, res) => {
  const users = await userService.getUsers();
  return sendSuccess(res, 200, "Get users successfully", users);
});

export const getUserById = catchAsync(async (req, res) => {
  const { id } = userIdParamSchema.parse(req.params);
  const user = await userService.getUserById(id);
  return sendSuccess(res, 200, "Get user successfully", user);
});

export const updateUser = catchAsync(async (req, res) => {
  const { id } = userIdParamSchema.parse(req.params);
  const user = await userService.updateUser(id, req.body);
  return sendSuccess(res, 200, "User updated successfully", user);
});
