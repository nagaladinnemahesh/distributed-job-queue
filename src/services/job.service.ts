import { prisma } from "../db/prisma.js";
import { jobQueue } from "../queue/queue.js";

export async function createJob(type: string, payload: any) {
  const job = await prisma.job.create({
    data: {
      type,
      payload,
    },
  });

  await jobQueue.add(type, {
    jobId: job.id,
    type,
    payload,
  });

  return job;
}

export async function getJobById(id: string) {
  return prisma.job.findUnique({
    where: { id },
  });
}
