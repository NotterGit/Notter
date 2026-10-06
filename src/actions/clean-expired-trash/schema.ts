import { z } from "zod";

export const CleanExpiredTrash = z.object({
  userId: z.string().optional(),
});
