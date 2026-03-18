import "dotenv/config";
import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { prisma } from "../db/prisma.js";
import { sendEmail } from "../services/email.service.js";

const worker = new Worker(
  "jobs",
  async (job) => {
    const { jobId, type, payload } = job.data;
    const attempts = job.attemptsMade + 1;
    const maxAttempts = 3;

    console.log(
      `[worker] picked job ${jobId} (type: ${type}, attempt ${attempts}/${maxAttempts})`,
    );

    await prisma.job.update({
      where: { id: jobId },
      data: { status: "PROCESSING" },
    });

    try {
      await executeJob(type, payload);

      await prisma.job.update({
        where: { id: jobId },
        data: { status: "COMPLETED", completedAt: new Date() },
      });

      console.log(`[worker] completed job ${jobId}`);
    } catch (error: any) {
      console.error(
        `[worker] job ${jobId} failed (attempt ${attempts}/${maxAttempts}) — ${error.message}`,
      );

      await prisma.job.update({
        where: { id: jobId },
        data: {
          attempts,
          errorMessage: error.message,
          status: attempts >= maxAttempts ? "DEAD" : "PENDING",
          failedAt: attempts >= maxAttempts ? new Date() : null,
        },
      });

      if (attempts >= maxAttempts) {
        console.error(
          `[worker] job ${jobId} moved to DEAD after ${attempts} attempts — ${error.message}`,
        );
      } else {
        console.log(
          `[worker] job ${jobId} will retry (attempt ${attempts}/${maxAttempts})`,
        );
        throw error; // rethrow so BullMQ knows to retry
      }
    }
  },
  {
    connection: redisConnection,
    concurrency: 5,
  },
);

async function executeJob(type: string, payload: any) {
  if (type === "send_email") {
    const { to, subject, body } = payload;

    if (!to) throw new Error("Missing required field: to");

    await sendEmail(
      to,
      subject ?? "Message from Job Queue",
      body ?? "This email was sent asynchronously via the job queue.",
    );
    return;
  }

  if (type === "generate_report") {
    console.log(`[worker] generating report for: ${JSON.stringify(payload)}`);
    await new Promise((r) => setTimeout(r, 1000));
    console.log(`[worker] report generated`);
    return;
  }

  throw new Error(`Unknown job type: ${type}`);
}

console.log("[worker] listening for jobs...");
