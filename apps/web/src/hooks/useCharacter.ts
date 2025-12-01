import {
  queryOptions,
  useQuery,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type { Character } from "@synth-rpg/types";
import { apiClient } from "../services/api-client";

export const characterQueryKey = (characterId: string | undefined) =>
  ["character", characterId ?? ""] as const;
type CharacterQueryKey = ReturnType<typeof characterQueryKey>;

export const characterQueryOptions = (characterId: string) =>
  queryOptions<Character>({
    queryKey: characterQueryKey(characterId),
    queryFn: () => apiClient.get<Character>(`/characters/${characterId}`),
  });

type CharacterQueryOptions = Omit<
  UseQueryOptions<Character, Error, Character, CharacterQueryKey>,
  "queryKey" | "queryFn" | "enabled"
>;

export const useCharacterQuery = (
  characterId: string | undefined,
  options?: CharacterQueryOptions
) =>
  useQuery<Character, Error, Character, CharacterQueryKey>({
    ...(characterId
      ? characterQueryOptions(characterId)
      : {
          queryKey: characterQueryKey(characterId),
          queryFn: async () => {
            throw new Error("characterId is required");
          },
        }),
    enabled: Boolean(characterId),
    ...options,
  });
