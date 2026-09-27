import { z } from "zod";

export const RemoveCover = z.object({
  id: z.string(),
  userId: z.string().optional(),
});
