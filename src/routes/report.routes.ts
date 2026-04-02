import { FastifyInstance } from "fastify";
import { prisma } from "../db/prisma.js";

export async function reportRoutes(fastify: FastifyInstance) {
  fastify.get("/reports", async () => {
    return prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    });
  });
}
