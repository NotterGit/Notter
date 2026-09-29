import type { ACTION, NOTE_ENTITY_TYPE } from "@prisma/client";

export type FieldsErrors<T> = {
  [K in keyof T]?: string[];
};

export type ActionState<TInput, TOutput> = {
  fieldErrors?: FieldsErrors<TInput>;
  error?: string | null;
  data?: TOutput;
};

export type Action<TInput, TOutput> = (data: TInput) => Promise<ActionState<TInput, TOutput>>;

export interface UseActionOptions<TOutput> {
  onSuccess?: (data: TOutput) => void;
  onError?: (error: string) => void;
  onComplete?: () => void;
}

export interface CreateAuditLogProps {
  entityId: string;
  entityType: NOTE_ENTITY_TYPE;
  entityTitle: string;
  action: ACTION;
  orgId?: string;
}
