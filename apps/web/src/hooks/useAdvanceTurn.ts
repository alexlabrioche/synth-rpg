import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { GameTurnEvent, Session } from "@synth-rpg/types";
import { apiClient } from "../services/api-client";
import { sessionQueryKey, type SessionDetailsResponse } from "./useSession";
import {
  sessionEventsQueryKey,
  type SessionEventsResponse,
} from "./useSessionEvents";

export interface AdvanceTurnInput {
  sessionId: string;
}

export interface AdvanceTurnResult {
  session: Session;
  event: GameTurnEvent;
}

type AdvanceTurnMutationOptions = Omit<
  UseMutationOptions<AdvanceTurnResult, Error, AdvanceTurnInput>,
  "mutationFn"
>;

export const useAdvanceTurnMutation = (
  options?: AdvanceTurnMutationOptions
) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation<AdvanceTurnResult, Error, AdvanceTurnInput>({
    mutationFn: ({ sessionId }) =>
      apiClient.post<AdvanceTurnResult>(`/sessions/${sessionId}/turns`),
    onSuccess: (result, variables, context, mutation) => {
      queryClient.setQueryData<SessionDetailsResponse>(
        sessionQueryKey(variables.sessionId),
        (prev) => ({
          session: result.session,
          prelude: prev?.prelude ?? null,
        })
      );

      queryClient.setQueryData<SessionEventsResponse>(
        sessionEventsQueryKey(variables.sessionId),
        (prev) => ({
          events: [...(prev?.events ?? []), result.event],
        })
      );

      onSuccess?.(result, variables, context, mutation);
    },
    ...restOptions,
  });
};
