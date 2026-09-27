import { z } from "zod";
import { SyncWorkspacePlan } from "./schema";
import type { ActionState } from "@/lib/create-safe-action";
import type { WorkspaceSettings } from "@/config/types/api.types";

export type InputType = z.infer<typeof SyncWorkspacePlan>;
export type ReturnType = ActionState<InputType, WorkspaceSettings & { userId: string }>;
