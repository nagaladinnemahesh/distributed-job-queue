// import "dotenv/config";
import dotenv from "dotenv";
dotenv.config({ override: false });

import Fastify from "fastify";
import cors from "@fastify/cors";
import { jobRoutes } from "./routes/job.routes.js";
import { metricsRoutes } from "./routes/metrics.routes.js";
import { healthRoutes } from "./routes/health.routes.js";
import { logger } from "./config/logger.js";

const fastify = Fastify({
  loggerInstance: logger,
});

fastify.register(cors, {
  origin: [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ],
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
