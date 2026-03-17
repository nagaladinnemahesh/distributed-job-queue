import "dotenv/config";
import { prisma } from "../db/prisma.js";

async function processJobs() {
  while (true) {
    const job = await prisma.job.findFirst({
      where: { status: "PENDING" },
    });

    if (!job) {
      await new Promise((r) => setTimeout(r, 2000));
      continue;
    }

    console.log(
      `[worker] picked job ${job.id} (type: ${job.type}, attempt: ${job.attempts + 1})`,
    );

    await prisma.job.update({
      where: { id: job.id },
      data: { status: "PROCESSING" },
    });

    try {
      await executeJob(job);

      await prisma.job.update({
        where: { id: job.id },
        data: { status: "COMPLETED", completedAt: new Date() },
      });

      console.log(`[worker] completed job ${job.id}`);
    } catch (error: any) {
      const newAttempts = job.attempts + 1;
      console.error(`[worker] job ${job.id} failed — ${error.message}`);

      if (newAttempts < job.maxAttempts) {
        // Exponential backoff: 5s, 30s, 2min...
        const delayMs = Math.pow(5, newAttempts) * 1000;
        const retryAt = new Date(Date.now() + delayMs);

        await prisma.job.update({
          where: { id: job.id },
          data: {
            status: "PENDING",
            attempts: newAttempts,
          },
        });

        console.log(
          `[worker] retrying job ${job.id} in ${delayMs / 1000}s (attempt ${newAttempts}/${job.maxAttempts})`,
        );
      } else {
        // Max attempts exceeded → dead letter
        await prisma.job.update({
          where: { id: job.id },
          data: {
            status: "DEAD",
            attempts: newAttempts,
            failedAt: new Date(),
          },
        });

        console.log(
          `[worker] job ${job.id} moved to DEAD after ${newAttempts} attempts`,
        );
      }
    }
  }
}

async function executeJob(job: any) {
  if (job.type === "send_email") {
    // Simulate a 50% failure rate to test retries
    if (Math.random() < 0.5) {
      throw new Error("SMTP server unreachable");
    }
    console.log(`[worker] sent email to ${JSON.stringify(job.payload)}`);
    return;
  }

  throw new Error(`Unknown job type: ${job.type}`);
}

processJobs();
