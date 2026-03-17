import { FastifyInstance } from "fastify";
import { createJob } from "../services/job.service.js";

export async function jobRoutes(fastify: FastifyInstance) {
  fastify.post("/jobs", async (request, reply) => {
    const { type, payload } = request.body as any;
    const job = await createJob(type, payload);

    return {
      jobId: job.id,
      status: job.status,
    };
  });
}
