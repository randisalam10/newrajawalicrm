import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL

  // Add connection_limit to prevent "Too many connections" in production
  // Next.js standalone runs multiple workers, each needs a small pool
  let url = dbUrl
  if (url && !url.includes("connection_limit")) {
    const separator = url.includes("?") ? "&" : "?"
    url = `${url}${separator}connection_limit=15&pool_timeout=30`
  }

  let ClientConstructor: any = PrismaClient
  try {
    if (!(PrismaClient.prototype as any)?.creditObligation) {
      const { createRequire } = require("module")
      const nativeRequire = createRequire(process.cwd() + "/package.json")
      const { PrismaClient: FreshClient } = nativeRequire("@prisma/client")
      if (FreshClient) {
        ClientConstructor = FreshClient
      }
    }
  } catch (e) {
    // fallback
  }

  return new ClientConstructor({
    datasources: url ? { db: { url } } : undefined,
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  })
}

// If cached client is missing newly added models, reset it
if (globalForPrisma.prisma) {
  const cached = globalForPrisma.prisma as any
  if (!cached.fixedCostContract || !cached.vehicleComplianceRecord || !cached.creditObligation) {
    globalForPrisma.prisma = undefined
  }
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient()

// Always cache prisma singleton in memory across all environments
globalForPrisma.prisma = prisma

export default prisma

