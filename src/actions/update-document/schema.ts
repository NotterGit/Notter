import { z } from "zod";

export const UpdateDocument = z.object({
  id: z.string(),
  userId: z.string().optional(),
  title: z.string().optional(),
  content: z.string().optional().nullable(),
  coverImage: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  isPublished: z.boolean().optional(),
  isPrivate: z.boolean().optional(),
  isPinned: z.boolean().optional(),
  isShort: z.boolean().optional(),
  shortId: z.string().optional(),
  verified: z.boolean().optional(),
  order: z.number().optional(),
  parentDocumentId: z.string().optional().nullable(),
  lastEditor: z.string().optional().nullable(),
  lastEditTime: z.string().optional().nullable(),
});
