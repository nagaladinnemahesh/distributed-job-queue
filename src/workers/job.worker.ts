// import "dotenv/config";
import dotenv from "dotenv";
dotenv.config({ override: false });

import { Worker } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { prisma } from "../db/prisma.js";
import { sendEmail } from "../services/email.service.js";
import { logger } from "../config/logger.js";
import { exec } from "child_process";
import path from "path";

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

function runPythonScript(data: any): Promise<string> {
  return new Promise((resolve, reject) => {
    const pythonCmd = "/home/ubuntu/distributed-job-queue/venv/bin/python";
    const scriptPath = "/home/ubuntu/distributed-job-queue/report.py";

    const command = `${pythonCmd} ${scriptPath} '${JSON.stringify(data).replace(/'/g, "\\'")}'`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error("PYTHON ERROR:", stderr);
        return reject(error);
      }
      resolve(stdout.trim());
    });
  });
}

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
    const jobs = await prisma.job.findMany({
      where: {
        status: "COMPLETED",
        startedAt: { not: null },
        completedAt: { not: null },
      },
      select: {
        id: true,
        type: true,
        startedAt: true,
        completedAt: true,
      },
    });

    const output = await runPythonScript(jobs);

    const cleanOutput = output.trim();

    // parse JSON from Python
    const reportData = JSON.parse(cleanOutput);

    // save to DB
    await prisma.report.createMany({
      data: reportData.map((row: any) => ({
        type: row.type,
        processingTime: row.processing_time,
        totalJobs: row.total_jobs,
      })),
    });

    logger.info(
      { event: "report_saved", count: reportData.length },
      "report saved to database",
    );

    return;
  }

  throw new Error(`Unknown job type: ${type}`);
}

logger.info({ event: "worker_started" }, "worker listening for jobs");
