import {
  queryOptions,
  useQuery,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type { Session, SessionPrelude } from "@synth-rpg/types";
import { apiClient } from "../services/api-client";

export interface SessionDetailsResponse {
  session: Session;
  prelude: SessionPrelude | null;
}

export const sessionQueryKey = (sessionId: string | undefined) =>
  ["session", sessionId ?? ""] as const;
type SessionQueryKey = ReturnType<typeof sessionQueryKey>;

export const sessionQueryOptions = (sessionId: string) =>
  queryOptions<SessionDetailsResponse>({
    queryKey: sessionQueryKey(sessionId),
    queryFn: () => apiClient.get<SessionDetailsResponse>(`/sessions/${sessionId}`),
  });

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
    ...(sessionId
      ? sessionQueryOptions(sessionId)
      : {
          queryKey: sessionQueryKey(sessionId),
          queryFn: async () => {
            throw new Error("sessionId is required");
          },
        }),
    enabled: Boolean(sessionId),
    ...options,
  });
