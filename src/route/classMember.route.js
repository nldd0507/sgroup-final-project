import { Router } from "express";

import * as classMemberController from "../controller/classMember.controller.js";

import { requireRole } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.js";
import { addMemberSchema } from "../schema/classMember.schema.js";

const classMemberRouter = Router({ mergeParams: true });
const adminOnly = requireRole("ADMIN");

classMemberRouter.get("/", classMemberController.getMembers);
classMemberRouter.post("/", adminOnly, validate(addMemberSchema), classMemberController.addMember);
classMemberRouter.delete("/:memberId", adminOnly, classMemberController.removeMember);

export default classMemberRouter;
