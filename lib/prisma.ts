// lib/prisma.ts
import { PrismaClient } from "../lib/generated/prisma";

<<<<<<< HEAD
const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
=======
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
>>>>>>> 2d0dfafbfea5162e70e8659b24a736ed2a955acd
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;