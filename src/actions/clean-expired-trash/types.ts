import { z } from "zod";
import { CleanExpiredTrash } from "./schema";
import type { ActionState } from "@/lib/create-safe-action";

export type InputType = z.infer<typeof CleanExpiredTrash>;
export type ReturnType = ActionState<InputType, { deletedCount: number }>;
