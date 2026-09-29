import { z } from "zod";

export const CreateDocument = z.object({
  title: z.string().min(1, { message: "Название обязательно" }),
  userId: z.string().optional(),
  parentDocumentId: z.string().optional().nullable(),
  parentDocument: z.string().optional().nullable(),
  creatorName: z.string().optional().nullable(),
  lastEditor: z.string().optional().nullable(),
  lastEditTime: z.string().optional().nullable(),
  premiumLevel: z.number().optional(),
  isOrg: z.boolean().optional(),
});
