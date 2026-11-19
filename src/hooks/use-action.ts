"use client";

import type { Action, FieldsErrors, UseActionOptions } from "@/config/types/actions.types";
import { useCallback, useRef, useState } from "react";

export const useAction = <TInput, TOutput>(
  action: Action<TInput, TOutput>,
  options: UseActionOptions<TOutput> = {}
) => {
  const [fieldErrors, setFieldErrors] = useState<FieldsErrors<TInput> | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [data, setData] = useState<TOutput | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const execute = useCallback(
    async (input: TInput): Promise<TOutput> => {
      setIsLoading(true);

      try {
        const result = await action(input);

        if (!result) {
          return Promise.reject("Something went wrong");
        }

        setFieldErrors(result.fieldErrors);

        if (result.error) {
          setError(result.error);
          optionsRef.current.onError?.(result.error);
          return Promise.reject(result.error);
        }

        if (result.fieldErrors) {
          const firstError = Object.values(result.fieldErrors).flat()[0] as string | undefined;
          return Promise.reject(firstError || "Проверьте введенные поля");
        }

        if (result.data) {
          setData(result.data);
          optionsRef.current.onSuccess?.(result.data);
          return result.data;
        }

        return Promise.reject("Something went wrong");
      } finally {
        setIsLoading(false);
        optionsRef.current.onComplete?.();
      }
    },
    [action]
  );

  return {
    execute,
    fieldErrors,
    error,
    data,
    isLoading,
  };
};
