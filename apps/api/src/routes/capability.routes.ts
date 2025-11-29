import type { FastifyInstance } from "fastify";
import {
  CAPABILITY_ARRAY,
  CAPABILITY_CATALOG,
  CAPABILITY_TRANSLATIONS,
} from "@synth-rpg/specs";

export async function capabilityRoutes(fastify: FastifyInstance) {
  fastify.get("/capabilities", async () => {
    return {
      catalog: CAPABILITY_CATALOG,
      list: CAPABILITY_ARRAY,
      translations: CAPABILITY_TRANSLATIONS,
    };
  });
}
