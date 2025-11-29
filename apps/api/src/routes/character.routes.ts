import type { FastifyInstance } from "fastify";
import { CAPABILITY_ICONS } from "@synth-rpg/specs";
import type { CapabilityIconId } from "@synth-rpg/types";
import { generateCharacter } from "../services/character.service";

export async function characterRoutes(fastify: FastifyInstance) {
  fastify.get("/characters-specs", async () => {
    return {
      icons: CAPABILITY_ICONS,
    };
  });

  fastify.post<{
    Body: { capabilityIconIds: CapabilityIconId[] };
  }>("/create-character", async (request, reply) => {
    const { capabilityIconIds } = request.body;

    if (!Array.isArray(capabilityIconIds) || capabilityIconIds.length === 0) {
      return reply
        .code(400)
        .send({ error: "capabilityIconIds must be a non-empty array" });
    }

    try {
      const character = await generateCharacter(
        { capabilityIconIds },
        (msg, meta) => request.log.info(meta ?? {}, msg)
      );
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
