import { idParamSchema } from "../schema/common.schema.js";
import * as classMemberService from "../service/classMember.service.js";
import { sendSuccess } from "../utils/responseHelper.js";
import { memberParamsSchema } from "../schema/classMember.schema.js";
import catchAsync from "../utils/catchAsync.js";

export const getMembers = catchAsync(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const members = await classMemberService.getMembers(req.user, id);
  return sendSuccess(res, 200, "Get class members successfully", members);
});

export const addMember = catchAsync(async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const result = await classMemberService.addMember(id, req.body.memberId);
  return sendSuccess(res, 201, "Member added successfully", result);
});

export const removeMember = catchAsync(async (req, res) => {
  const { id, memberId } = memberParamsSchema.parse(req.params);
  await classMemberService.removeMember(id, memberId);
  return res.status(204).end();
});
