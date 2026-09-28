import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function getActivePrisma(): PrismaClient {
  if (
    globalForPrisma.prisma &&
    (globalForPrisma.prisma as any).masterMaterial &&
    (globalForPrisma.prisma as any).materialPriceHistory
  ) {
    return globalForPrisma.prisma
  }

  // Clear stale module cache if instance is missing models
  try {
    if (globalForPrisma.prisma) {
      try {
        globalForPrisma.prisma.$disconnect()
      } catch (e) {}
      delete globalForPrisma.prisma
    }

    if (typeof require !== "undefined" && require.cache) {
      Object.keys(require.cache).forEach((key) => {
        if (key.includes("@prisma") || key.includes(".prisma")) {
          delete require.cache[key]
        }
      })
    }
  } catch (e) {}

  let ClientClass: any = PrismaClient
  try {
    if (typeof require !== "undefined") {
      ClientClass = require("@prisma/client").PrismaClient
    }
  } catch (e) {}

  const newClient = new ClientClass()
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = newClient
  }
  return newClient
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const active = getActivePrisma()
    const value = Reflect.get(active, prop, receiver)
    if (typeof value === "function") {
      return value.bind(active)
    }
    return value
  },
})

export default prisma

