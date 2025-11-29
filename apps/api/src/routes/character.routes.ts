import type { FastifyInstance } from "fastify";
import type { CapabilityId, Lang } from "@synth-rpg/types";
import {
  generateCharacter,
  getCharacterById,
  listCharacters,
} from "../services/character.service";

export async function characterRoutes(fastify: FastifyInstance) {
  fastify.post<{
    Body: { capabilityIds: CapabilityId[]; lang?: Lang };
  }>("/characters", async (request, reply) => {
    const { capabilityIds, lang = "en" } = request.body ?? {};

    if (!Array.isArray(capabilityIds) || capabilityIds.length === 0) {
      return reply.code(400).send({
        error: "capabilityIds must be a non-empty array",
      });
    }

    try {
      const character = await generateCharacter({ capabilityIds, lang });
      return character;
    } catch (err: any) {
      request.log.error(
        { err, stack: err?.stack, message: err?.message },
        "Failed to create character"
      );
      return reply.code(500).send({
        error: "Failed to create character",
        detail: err?.message ?? "Unknown error",
      });
    }
  });

  fastify.get("/characters", async () => {
    return { characters: listCharacters() };
  });

  fastify.get<{
    Params: { characterId: string };
  }>("/characters/:characterId", async (request, reply) => {
    const { characterId } = request.params ?? {};

    if (!characterId || typeof characterId !== "string") {
      return reply.code(400).send({ error: "characterId is required" });
    }

    const character = getCharacterById(characterId);
    if (!character) {
      return reply.code(404).send({ error: "Character not found" });
    }

    return character;
  });
}
