import { z } from "zod";

export const ArchiveDocument = z.object({
  id: z.string(),
  userId: z.string().optional(),
});
