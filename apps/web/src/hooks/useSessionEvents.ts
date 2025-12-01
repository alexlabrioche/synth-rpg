import {
  queryOptions,
  useQuery,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type { GameTurnEvent } from "@synth-rpg/types";
import { apiClient } from "../services/api-client";

export interface SessionEventsResponse {
  events: GameTurnEvent[];
}

export const sessionEventsQueryKey = (sessionId: string | undefined) =>
  ["session-events", sessionId ?? ""] as const;
type SessionEventsQueryKey = ReturnType<typeof sessionEventsQueryKey>;

export const sessionEventsQueryOptions = (sessionId: string) =>
  queryOptions<SessionEventsResponse>({
    queryKey: sessionEventsQueryKey(sessionId),
    queryFn: () =>
      apiClient.get<SessionEventsResponse>(`/sessions/${sessionId}/events`),
  });

type SessionEventsQueryOptions = Omit<
  UseQueryOptions<
    SessionEventsResponse,
    Error,
    SessionEventsResponse,
    SessionEventsQueryKey
  >,
  "queryKey" | "queryFn" | "enabled"
>;

export const useSessionEventsQuery = (
  sessionId: string | undefined,
  options?: SessionEventsQueryOptions
) =>
  useQuery<
    SessionEventsResponse,
    Error,
    SessionEventsResponse,
    SessionEventsQueryKey
  >({
    ...(sessionId
      ? sessionEventsQueryOptions(sessionId)
      : {
          queryKey: sessionEventsQueryKey(sessionId),
          queryFn: async () => {
            throw new Error("sessionId is required");
          },
        }),
    enabled: Boolean(sessionId),
    ...options,
  });
