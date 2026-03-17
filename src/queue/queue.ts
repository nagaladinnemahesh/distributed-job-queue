import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";

export const jobQueue = new Queue("jobs", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 3000,
    },
  },
});
// ```

// Clear dead jobs, restart the worker, and submit a `generate_report` job again. This time you should see:
// ```
// [worker] picked job xxx (type: generate_report, attempt 1/3)
// [worker] job xxx failed (attempt 1/3) — Unknown job type: generate_report
// [worker] job xxx will retry (attempt 1/3)

// [worker] picked job xxx (type: generate_report, attempt 2/3)
// [worker] job xxx failed (attempt 2/3) — Unknown job type: generate_report
// [worker] job xxx will retry (attempt 2/3)

// [worker] picked job xxx (type: generate_report, attempt 3/3)
// [worker] job xxx moved to DEAD after 3 attempts — Unknown job type: generate_report
