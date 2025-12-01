import {
  queryOptions,
  useQuery,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type { Character } from "@synth-rpg/types";
import { apiClient } from "../services/api-client";

export interface CharactersResponse {
  characters: Character[];
}

export const CHARACTERS_QUERY_KEY = ["characters"] as const;
type CharactersQueryKey = typeof CHARACTERS_QUERY_KEY;

export const charactersQueryOptions = () =>
  queryOptions<CharactersResponse, Error>({
    queryKey: CHARACTERS_QUERY_KEY,
    queryFn: () => apiClient.get<CharactersResponse>("/characters"),
  });

type CharactersQueryOptions = Omit<
  UseQueryOptions<
    CharactersResponse,
    Error,
    CharactersResponse,
    CharactersQueryKey
  >,
  "queryKey" | "queryFn"
>;

export const useCharactersQuery = (options?: CharactersQueryOptions) =>
  useQuery<CharactersResponse, Error, CharactersResponse, CharactersQueryKey>({
    ...charactersQueryOptions(),
    ...options,
  });
