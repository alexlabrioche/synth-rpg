import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { Session, SessionPrelude } from "@synth-rpg/types";
import { apiClient } from "../services/api-client";

export interface SessionDetailsResponse {
  session: Session;
  prelude: SessionPrelude | null;
}

export const sessionQueryKey = (sessionId: string | undefined) =>
  ["session", sessionId ?? ""] as const;
type SessionQueryKey = ReturnType<typeof sessionQueryKey>;

type SessionQueryOptions = Omit<
  UseQueryOptions<
    SessionDetailsResponse,
    Error,
    SessionDetailsResponse,
    SessionQueryKey
  >,
  "queryKey" | "queryFn" | "enabled"
>;

export const useSessionQuery = (
  sessionId: string | undefined,
  options?: SessionQueryOptions
) =>
  useQuery<
    SessionDetailsResponse,
    Error,
    SessionDetailsResponse,
    SessionQueryKey
  >({
    queryKey: sessionQueryKey(sessionId),
    queryFn: async () => {
      if (!sessionId) {
        throw new Error("sessionId is required");
      }

      return apiClient.get<SessionDetailsResponse>(`/sessions/${sessionId}`);
    },
    enabled: Boolean(sessionId),
    ...options,
  });
