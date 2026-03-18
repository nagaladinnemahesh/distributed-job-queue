import { FastifyInstance } from "fastify";
import {
  createJob,
  getJobById,
  listJobs,
  retryJob,
} from "../services/job.service.js";

export async function jobRoutes(fastify: FastifyInstance) {
  fastify.post("/jobs", async (request, reply) => {
    const { type, payload } = request.body as any;

    if (!type) {
      return reply.status(400).send({ error: "type is required" });
    }

    try {
      const job = await createJob(type, payload);
      return reply.status(201).send({
        jobId: job.id,
        status: job.status,
      });
    } catch (error: any) {
      return reply.status(400).send({ error: error.message });
    }
  });

  fastify.get("/jobs/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const job = await getJobById(id);

    if (!job) return reply.status(404).send({ error: "Job not found" });

    return {
      jobId: job.id,
      type: job.type,
      status: job.status,
      attempts: job.attempts,
      maxAttempts: job.maxAttempts,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      failedAt: job.failedAt,
      errorMessage: job.errorMessage ?? null,
    };
  });

  fastify.get("/jobs", async (request, reply) => {
    const { status, type } = request.query as {
      status?: string;
      type?: string;
    };

    const jobs = await listJobs(status, type);

    return {
      count: jobs.length,
      jobs: jobs.map((job) => ({
        jobId: job.id,
        type: job.type,
        status: job.status,
        attempts: job.attempts,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
        errorMessage: job.errorMessage ?? null,
      })),
    };
  });

  fastify.post(
    "/jobs/:id/retry",
    {
      config: { rawBody: false },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      try {
        const job = await retryJob(id);
        return {
          jobId: job.id,
          status: job.status,
          message: "Job re-queued successfully",
        };
      } catch (error: any) {
        return reply.status(400).send({ error: error.message });
      }
    },
  );
}
