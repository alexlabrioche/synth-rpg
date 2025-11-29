import type { FastifyInstance } from "fastify";
import type { Lang } from "@synth-rpg/types";
import {
  CharacterNotFoundError,
  SessionNotFoundError,
  playNextTurn,
  startSession,
} from "../services/session.service";

export async function sessionRoutes(fastify: FastifyInstance) {
  fastify.post<{
    Body: { characterId: string; lang?: Lang };
  }>("/sessions/start", async (request, reply) => {
    const { characterId, lang = "en" } = request.body ?? {};

    if (!characterId || typeof characterId !== "string") {
      return reply.code(400).send({ error: "characterId is required" });
    }

    try {
      const result = await startSession({ characterId, lang });
      return result;
    } catch (err: any) {
      if (err instanceof CharacterNotFoundError) {
        return reply.code(404).send({ error: err.message });
      }

      request.log.error(
        { err, stack: err?.stack, message: err?.message },
        "Failed to start session"
      );
      return reply.code(500).send({
        error: "Failed to start session",
        detail: err?.message ?? "Unknown error",
      });
    }
  });

  fastify.post<{
    Params: { sessionId: string };
  }>("/sessions/:sessionId/turn", async (request, reply) => {
    const { sessionId } = request.params ?? {};

    if (!sessionId || typeof sessionId !== "string") {
      return reply.code(400).send({ error: "sessionId is required" });
    }

    try {
      const result = await playNextTurn({ sessionId });
      return result;
    } catch (err: any) {
      if (
        err instanceof SessionNotFoundError ||
        err instanceof CharacterNotFoundError
      ) {
        return reply.code(404).send({ error: err.message });
      }

      request.log.error(
        { err, stack: err?.stack, message: err?.message },
        "Failed to play next turn"
      );
      return reply.code(500).send({
        error: "Failed to play next turn",
        detail: err?.message ?? "Unknown error",
      });
    }
  });
}
