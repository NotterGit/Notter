import { z } from "zod";
import { ReorderDocuments } from "./schema";
import type { ActionState } from "@/lib/create-safe-action";
import type { Document } from "@prisma/client";

export type InputType = z.infer<typeof ReorderDocuments>;
export type ReturnType = ActionState<InputType, { success: boolean }>;
