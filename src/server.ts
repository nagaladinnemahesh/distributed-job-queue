import "dotenv/config";
import Fastify from "fastify";
import { jobRoutes } from "./routes/job.routes.js";

const fastify = Fastify({
  logger: true,
});

fastify.register(jobRoutes);

fastify.get("/", async () => {
  return { message: "Distributed Job Queue Running" };
});

const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
