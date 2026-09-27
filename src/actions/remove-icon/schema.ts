import { z } from "zod";

export const RemoveIcon = z.object({
  id: z.string(),
  userId: z.string().optional(),
});
