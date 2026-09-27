import { z } from "zod";
import { SyncWorkspacePlan } from "./schema";
import type { ActionState } from "@/lib/create-safe-action";
import type { Workspace } from "@prisma/client";

export type InputType = z.infer<typeof SyncWorkspacePlan>;
export type ReturnType = ActionState<InputType, Workspace>;
