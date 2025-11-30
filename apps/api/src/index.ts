import "./config/env";
import Fastify from "fastify";
import { capabilityRoutes } from "./routes/capability.routes";
import { characterRoutes } from "./routes/character.routes";
import { sessionRoutes } from "./routes/session.routes";

const fastify = Fastify({
  logger: true,
});

fastify.register(capabilityRoutes, { prefix: "/api/v1" });
fastify.register(characterRoutes, { prefix: "/api/v1" });
fastify.register(sessionRoutes, { prefix: "/api/v1" });

const start = async () => {
  try {
    await fastify.listen({ port: 4000, host: "localhost" });
    fastify.log.info("API listening on http://localhost:4000");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
