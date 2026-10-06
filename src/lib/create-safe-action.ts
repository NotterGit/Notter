import { z } from "zod";
import type { ActionState, FieldsErrors } from "@/config/types/actions.types";

export type { ActionState, FieldsErrors };

export function createSafeAction<TInput, TOutput>(
  schema: z.Schema<TInput>,
  handler: (validatedData: TInput) => Promise<ActionState<TInput, TOutput>>
) {
  return async (data: TInput): Promise<ActionState<TInput, TOutput>> => {
    const validationResult = schema.safeParse(data);
    if (!validationResult.success) {
      return {
        fieldErrors: validationResult.error.flatten().fieldErrors as FieldsErrors<TInput>,
      };
    }

    return handler(validationResult.data);
  };
}
