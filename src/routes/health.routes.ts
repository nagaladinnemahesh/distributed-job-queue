import { FastifyInstance } from "fastify";
import { prisma } from "../db/prisma.js";
import { jobQueue } from "../queue/queue.js";

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get("/health", async (request, reply) => {
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      services: {
        database: "unknown",
        redis: "unknown",
      },
    };

    // Check PostgreSQL
    try {
      await prisma.$queryRaw`SELECT 1`;
      health.services.database = "healthy";
    } catch {
      health.services.database = "unhealthy";
      health.status = "unhealthy";
    }

    // Check Redis via BullMQ's existing connection
    try {
      const client = await jobQueue.client;
      await client.ping();
      health.services.redis = "healthy";
    } catch {
      health.services.redis = "unhealthy";
      health.status = "unhealthy";
    }

    const statusCode = health.status === "healthy" ? 200 : 503;
    return reply.status(statusCode).send(health);
  });
}
