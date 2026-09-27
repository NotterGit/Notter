import { z } from "zod";

export const ReorderDocuments = z.object({
  userId: z.string().optional(),
  items: z.array(
    z.object({
      id: z.string(),
      order: z.number(),
      parentDocument: z.string().optional().nullable(),
    })
  ),
  lastEditor: z.string().optional(),
  lastEditTime: z.string().optional(),
});
