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
    const { createRequire } = require("module")
    const nativeRequire = createRequire(process.cwd() + "/package.json")
    if (nativeRequire.cache) {
      for (const k of Object.keys(nativeRequire.cache)) {
        if (k.includes("@prisma") || k.includes(".prisma")) {
          delete nativeRequire.cache[k]
        }
      }
    }
    const { PrismaClient: FreshClient } = nativeRequire("@prisma/client")
    if (FreshClient) {
      ClientConstructor = FreshClient
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

function getValidClient(): PrismaClient {
  let client = globalForPrisma.prisma
  if (
    !client ||
    !(client as any).crusherDestination ||
    !(client as any).crusherRetaseSetting
  ) {
    try {
      client?.$disconnect().catch(() => {})
    } catch (e) {}
    client = createPrismaClient()
    globalForPrisma.prisma = client
  }
  return client as PrismaClient
}

// Proxy delegates every access to an up-to-date PrismaClient instance
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getValidClient()
    const value = Reflect.get(client, prop, receiver)
    if (typeof value === "function") {
      return value.bind(client)
    }
    return value
  },
})

export default prisma

