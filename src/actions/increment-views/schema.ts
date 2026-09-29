import { z } from "zod";

export const IncrementViews = z.object({
  id: z.string(),
});
