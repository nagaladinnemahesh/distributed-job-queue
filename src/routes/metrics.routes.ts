import { FastifyInstance } from "fastify";
import { prisma } from "../db/prisma.js";
import { jobQueue } from "../queue/queue.js";

export async function metricsRoutes(fastify: FastifyInstance) {
  fastify.get("/metrics", async (request, reply) => {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      jobQueue.getWaitingCount(),
      jobQueue.getActiveCount(),
      jobQueue.getCompletedCount(),
      jobQueue.getFailedCount(),
      jobQueue.getDelayedCount(),
    ]);

    const [totalCompleted, totalFailed, totalDead, completedJobs] =
      await Promise.all([
        prisma.job.count({ where: { status: "COMPLETED" } }),
        prisma.job.count({ where: { status: "FAILED" } }),
        prisma.job.count({ where: { status: "DEAD" } }),
        prisma.job.findMany({
          where: {
            status: "COMPLETED",
            completedAt: { not: null },
            startedAt: { not: null },
          },
          select: {
            startedAt: true,
            completedAt: true,
          },
        }),
      ]);

    const avgProcessingMs =
      completedJobs.length > 0
        ? Math.round(
            completedJobs.reduce((sum, job) => {
              return (
                sum + (job.completedAt!.getTime() - job.startedAt!.getTime())
              );
            }, 0) / completedJobs.length,
          )
        : 0;

    const total = totalCompleted + totalFailed + totalDead;
    const successRate =
      total > 0 ? ((totalCompleted / total) * 100).toFixed(1) : "0.0";

    return {
      queue: {
        waiting,
        active,
        delayed,
        completed,
        failed,
      },
      database: {
        totalCompleted,
        totalFailed,
        totalDead,
        successRate: `${successRate}%`,
        avgProcessingMs,
      },
    };
  });
}
