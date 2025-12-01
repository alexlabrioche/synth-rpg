import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { CapabilityId, Character, Lang } from "@synth-rpg/types";
import { apiClient } from "../services/api-client";
import { CHARACTERS_QUERY_KEY } from "./useCharacters";
import { characterQueryKey } from "./useCharacter";

export interface CreateCharacterInput {
  capabilityIds: CapabilityId[];
  lang?: Lang;
}

type CreateCharacterMutationOptions = Omit<
  UseMutationOptions<Character, Error, CreateCharacterInput>,
  "mutationFn"
>;

export const useCreateCharacterMutation = (
  options?: CreateCharacterMutationOptions
) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation<Character, Error, CreateCharacterInput>({
    mutationFn: (input) => apiClient.post<Character>("/characters", input),
    onSuccess: (character, variables, context, mutation) => {
      queryClient.invalidateQueries({ queryKey: CHARACTERS_QUERY_KEY });
      queryClient.setQueryData(characterQueryKey(character.id), character);
      onSuccess?.(character, variables, context, mutation);
    },
    ...restOptions,
  });
};
