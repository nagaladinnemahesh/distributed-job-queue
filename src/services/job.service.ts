import { prisma } from "../db/prisma.js";
import { jobQueue } from "../queue/queue.js";

const VALID_JOB_TYPES = [
  "send_email",
  "generate_report",
  "resize_image",
  "send_notification",
];

export async function createJob(type: string, payload: any) {
  if (!VALID_JOB_TYPES.includes(type)) {
    throw new Error(
      `Invalid job type: ${type}. Valid types: ${VALID_JOB_TYPES.join(", ")}`,
    );
  }
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
