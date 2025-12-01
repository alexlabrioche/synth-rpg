import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import type { Lang, Session, SessionPrelude } from "@synth-rpg/types";
import { apiClient } from "../services/api-client";
import { sessionQueryKey } from "./useSession";

export interface StartSessionInput {
  characterId: string;
  lang?: Lang;
}

export interface StartSessionResult {
  session: Session;
  prelude: SessionPrelude;
}

type StartSessionMutationOptions = Omit<
  UseMutationOptions<StartSessionResult, Error, StartSessionInput>,
  "mutationFn"
>;

export const useStartSessionMutation = (
  options?: StartSessionMutationOptions
) => {
  const queryClient = useQueryClient();
  const { onSuccess, ...restOptions } = options ?? {};

  return useMutation<StartSessionResult, Error, StartSessionInput>({
    mutationFn: (input) =>
      apiClient.post<StartSessionResult>("/sessions", input),
    onSuccess: (result, variables, context, mutation) => {
      queryClient.setQueryData(sessionQueryKey(result.session.id), {
        session: result.session,
        prelude: result.prelude,
      });
      onSuccess?.(result, variables, context, mutation);
    },
    ...restOptions,
  });
};
