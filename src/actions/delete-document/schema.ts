import { z } from "zod";

export const DeleteDocument = z.object({
  id: z.string(),
  userId: z.string().optional(),
});
