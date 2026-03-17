import { prisma } from "../db/prisma.js";

export async function createJob(type: string, payload: any) {
  const job = await prisma.job.create({
    data: {
      type,
      payload,
    },
  });

  return job;
}

export async function getJobById(id: string) {
  return prisma.job.findUnique({
    where: { id },
  });
}
