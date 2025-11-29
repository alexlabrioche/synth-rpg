import Fastify from "fastify";
import { characterRoutes } from "./routes/character.routes";

const fastify = Fastify({
  logger: true,
});

fastify.register(characterRoutes, { prefix: "/api/v1" });

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
