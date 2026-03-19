// import "dotenv/config";
import dotenv from "dotenv";
dotenv.config({ override: false });

import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import { jobRoutes } from "./routes/job.routes.js";
import { metricsRoutes } from "./routes/metrics.routes.js";
import { healthRoutes } from "./routes/health.routes.js";
import { logger } from "./config/logger.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const fastify = Fastify({
  loggerInstance: logger,
});

fastify.register(cors, {
  origin: ["*"],
});

fastify.register(fastifyStatic, {
  root: join(__dirname, "../dashboard/dist"),
  prefix: "/",
  decorateReply: false,
});

fastify.register(jobRoutes);
fastify.register(metricsRoutes);
fastify.register(healthRoutes);

// fastify.get("/", async () => {
//   return { message: "Distributed Job Queue Running" };
// });

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
