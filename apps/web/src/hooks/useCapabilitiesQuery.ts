import {
  queryOptions,
  useQuery,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type {
  CAPABILITY_ARRAY,
  CAPABILITY_CATALOG,
  CAPABILITY_TRANSLATIONS,
} from "@synth-rpg/specs";
import { apiClient } from "../services/api-client";

export type CapabilitiesResponse = {
  catalog: typeof CAPABILITY_CATALOG;
  list: typeof CAPABILITY_ARRAY;
  translations: typeof CAPABILITY_TRANSLATIONS;
};

const CAPABILITIES_QUERY_KEY = ["capabilities"] as const;
type CapabilitiesQueryKey = typeof CAPABILITIES_QUERY_KEY;

export const capabilitiesQueryOptions = () =>
  queryOptions<
    CapabilitiesResponse,
    Error,
    CapabilitiesResponse,
    CapabilitiesQueryKey
  >({
    queryKey: CAPABILITIES_QUERY_KEY,
    queryFn: () => apiClient.get<CapabilitiesResponse>("/capabilities"),
    staleTime: 1000 * 60 * 5,
  });

type CapabilitiesQueryOptions = Omit<
  UseQueryOptions<
    CapabilitiesResponse,
    Error,
    CapabilitiesResponse,
    CapabilitiesQueryKey
  >,
  "queryKey" | "queryFn"
>;

export const useCapabilitiesQuery = (options?: CapabilitiesQueryOptions) =>
  useQuery<
    CapabilitiesResponse,
    Error,
    CapabilitiesResponse,
    CapabilitiesQueryKey
  >({
    ...capabilitiesQueryOptions(),
    ...options,
  });
