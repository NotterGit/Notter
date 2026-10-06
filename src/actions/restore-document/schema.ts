import { z } from "zod";

export const RestoreDocument = z.object({
  id: z.string(),
  userId: z.string().optional(),
});
