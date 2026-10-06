import { z } from "zod";
import { SetArchiveRetention } from "./schema";
import type { ActionState } from "@/lib/create-safe-action";
import type { ArchivedSettings } from "@/config/types/api.types";

export type InputType = z.infer<typeof SetArchiveRetention>;
export type ReturnType = ActionState<InputType, ArchivedSettings>;
