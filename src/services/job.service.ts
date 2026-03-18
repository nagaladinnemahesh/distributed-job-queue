import { Job } from "bullmq";
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

export async function listJobs(status?: string, type?: string) {
  return prisma.job.findMany({
    where: {
      ...(status && { status }),
      ...(type && { type }),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function retryJob(id: string) {
  const job = await prisma.job.findUnique({ where: { id } });

  if (!job) throw new Error("Job not found");

  if (job.status !== "DEAD" && job.status !== "FAILED") {
    throw new Error(`Job cannot be retried - current status: ${job.status}`);
  }

  const updated = await prisma.job.update({
    where: { id },
    data: {
      status: "PENDING",
      attempts: 0,
      errorMessage: null,
      failedAt: null,
    },
  });

  await jobQueue.add(job.type, {
    jobId: job.id,
    type: job.type,
    payload: job.payload,
  });

  return updated;
}
