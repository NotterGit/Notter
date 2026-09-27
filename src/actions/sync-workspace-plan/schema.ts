import { z } from "zod";

export const SyncWorkspacePlan = z.object({
  userId: z.string(),
  premiumLevel: z.number(),
  isOrg: z.boolean(),
});
