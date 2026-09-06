import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

// Pastikan jika schema Prisma baru di-generate, instance lama di globalThis di-refresh
if (globalForPrisma.prisma && !(globalForPrisma.prisma as any).webPushSubscription) {
  try {
    globalForPrisma.prisma.$disconnect()
  } catch (e) {}
  delete globalForPrisma.prisma
}

export const prisma =
  globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

