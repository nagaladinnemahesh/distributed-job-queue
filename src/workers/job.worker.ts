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

    console.log("Processing job:", job.id);

    await prisma.job.update({
      where: { id: job.id },
      data: { status: "PROCESSING" },
    });

    try {
      if (job.type === "send_email") {
        console.log("Sending email to:", job.payload);
      }

      await prisma.job.update({
        where: { id: job.id },
        data: { status: "COMPLETED", completedAt: new Date() },
      });

      console.log("Job Completed:", job.id);
    } catch (error) {
      await prisma.job.update({
        where: { id: job.id },
        data: { status: "FAILED" },
      });

      console.error("Job failed:", job.id);
    }
  }
}

processJobs();
