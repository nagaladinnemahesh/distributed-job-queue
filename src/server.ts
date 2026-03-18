import "dotenv/config";
import Fastify from "fastify";
import { jobRoutes } from "./routes/job.routes.js";
import { metricsRoutes } from "./routes/metrics.routes.js";
import { healthRoutes } from "./routes/health.routes.js";
import { logger } from "./config/logger.js";

const fastify = Fastify({
  loggerInstance: logger,
});

fastify.register(jobRoutes);
fastify.register(metricsRoutes);
fastify.register(healthRoutes);

fastify.get("/", async () => {
  return { message: "Distributed Job Queue Running" };
});

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
  } catch (err) {
    // fastify.log.error(err);
    logger.error(err);
    process.exit(1);
  }
};

start();
