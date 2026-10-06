import { z } from "zod";

export const MoveDocument = z.object({
  id: z.string(),
  targetParentId: z.string().optional().nullable(),
  parentDocument: z.string().optional().nullable(),
  newOrder: z.number().optional(),
  userId: z.string().optional(),
  lastEditor: z.string().optional().nullable(),
  lastEditTime: z.string().optional().nullable(),
});
