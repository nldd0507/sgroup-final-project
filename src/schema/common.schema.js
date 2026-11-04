import { z } from "zod";

export const idField = (label) =>
  z.coerce
    .number({ error: `${label} must be a number` })
    .int(`${label} must be an integer`)
    .positive(`${label} must be positive`)
    .max(2_147_483_647, `${label} is out of range`);

export const idParamSchema = z.object({ id: idField("Id") });
