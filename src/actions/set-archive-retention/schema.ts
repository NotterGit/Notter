import { z } from "zod";

export const SetArchiveRetention = z.object({
  userId: z.string(),
  retentionDays: z.number().min(1).max(90),
  premiumLevel: z.number().optional(),
});
