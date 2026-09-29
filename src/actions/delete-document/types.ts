import { z } from "zod";
import { DeleteDocument } from "./schema";
import type { ActionState } from "@/lib/create-safe-action";
import type { Document } from "@prisma/client";

export type InputType = z.infer<typeof DeleteDocument>;
export type ReturnType = ActionState<InputType, Document>;
