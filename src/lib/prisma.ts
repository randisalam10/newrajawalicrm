import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL

  // Add connection_limit to prevent "Too many connections" in production
  // Next.js standalone runs multiple workers, each needs a small pool
  let url = dbUrl
  if (url && !url.includes("connection_limit")) {
    const separator = url.includes("?") ? "&" : "?"
    url = `${url}${separator}connection_limit=5&pool_timeout=20`
  }

  return new PrismaClient({
    datasources: url ? { db: { url } } : undefined,
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  })
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}

export default prisma
