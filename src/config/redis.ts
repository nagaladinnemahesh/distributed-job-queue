import { ConnectionOptions } from "bullmq";
export const redisConnection: ConnectionOptions = {
  host: "localhost",
  port: 6379,
  //   maxRetriesPerRequest: null,
};
