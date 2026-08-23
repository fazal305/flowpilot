import { PrismaClient } from "@prisma/client";

// Single shared Prisma instance for the process — repositories import this
// rather than each constructing their own client.
export const prisma = new PrismaClient();
