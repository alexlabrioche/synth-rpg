import type { FastifyInstance } from "fastify";
import { CAPABILITY_CATALOG } from "@synth-rpg/specs";
import type { CapabilityId, Lang } from "@synth-rpg/types";
import { generateCharacter } from "../services/character.service";

export async function characterRoutes(fastify: FastifyInstance) {
  fastify.get("/characters-specs", async () => {
    return { icons: CAPABILITY_CATALOG };
  });

  fastify.post<{
    Body: { capabilities: CapabilityId[]; lang?: Lang };
  }>("/create-character", async (request, reply) => {
    const { capabilities, lang = "en" } = request.body;

    if (!Array.isArray(capabilities) || capabilities.length === 0) {
      return reply
        .code(400)
        .send({ error: "capabilities must be a non-empty array" });
    }

    try {
      const character = await generateCharacter({ capabilities, lang });
      return character;
    } catch (err: any) {
      request.log.error(
        { err, stack: err?.stack, message: err?.message },
        "Failed to generate character"
      );
      return reply.code(500).send({
        error: "Failed to generate character",
        detail: err?.message ?? "Unknown error",
      });
    }
  });
}
