import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { GameTurnEvent } from "@synth-rpg/types";
import { apiClient } from "../services/api-client";

export interface SessionEventsResponse {
  events: GameTurnEvent[];
}

export const sessionEventsQueryKey = (sessionId: string | undefined) =>
  ["session-events", sessionId ?? ""] as const;
type SessionEventsQueryKey = ReturnType<typeof sessionEventsQueryKey>;

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
    queryKey: sessionEventsQueryKey(sessionId),
    queryFn: async () => {
      if (!sessionId) {
        throw new Error("sessionId is required");
      }

      return apiClient.get<SessionEventsResponse>(
        `/sessions/${sessionId}/events`
      );
    },
    enabled: Boolean(sessionId),
    ...options,
  });
