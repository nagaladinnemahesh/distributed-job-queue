// import "dotenv/config";
import dotenv from "dotenv";
dotenv.config({ override: false });

import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { prisma } from "../db/prisma.js";
import { sendEmail } from "../services/email.service.js";
import { logger } from "../config/logger.js";

const worker = new Worker(
  "jobs",
  async (job) => {
    const { jobId, type, payload } = job.data;
    const attempts = job.attemptsMade + 1;
    const maxAttempts = 3;
    const startTime = Date.now();

    logger.info(
      {
        event: "job_started",
        jobId,
        type,
        attempt: attempts,
        maxAttempts,
      },
      "job started",
    );

    await prisma.job.update({
      where: { id: jobId },
      data: {
        status: "PROCESSING",
        startedAt: new Date(), // correct place
      },
    });

    try {
      await executeJob(type, payload);

      const durationMs = Date.now() - startTime;

      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      logger.info(
        {
          event: "job_completed",
          jobId,
          type,
          durationMs,
          attempt: attempts,
        },
        "job completed",
      );
    } catch (error: any) {
      const durationMs = Date.now() - startTime;

      logger.error(
        {
          event: "job_failed",
          jobId,
          type,
          attempt: attempts,
          maxAttempts,
          durationMs,
          error: error.message,
        },
        "job failed",
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
        logger.warn(
          {
            event: "job_dead",
            jobId,
            type,
            attempts,
            error: error.message,
          },
          "job moved to dead letter queue",
        );
      } else {
        throw error;
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
    logger.info({ event: "report_generating", payload }, "generating report");
    await new Promise((r) => setTimeout(r, 1000));
    logger.info({ event: "report_generated", payload }, "report generated");
    return;
  }

  throw new Error(`Unknown job type: ${type}`);
}

logger.info({ event: "worker_started" }, "worker listening for jobs");
