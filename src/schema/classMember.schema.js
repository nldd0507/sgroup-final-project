import { z } from "zod";
import { idField } from "./common.schema.js";

export const addMemberSchema = z.object({ memberId: idField("Member id") });

export const memberParamsSchema = z.object({
  id: idField("Class id"),
  memberId: idField("Member id"),
});
