import { z } from "zod";
import { SetArchiveRetention } from "./schema";
import type { ActionState } from "@/lib/create-safe-action";
import type { ArchiveSettings } from "@prisma/client";

export type InputType = z.infer<typeof SetArchiveRetention>;
export type ReturnType = ActionState<InputType, ArchiveSettings>;
