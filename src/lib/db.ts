import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  const urlString = process.env.DATABASE_URL;
  if (!urlString) {
    return new PrismaClient();
  }

  try {
    const normalizedUrl = urlString.replace(/^mysql:\/\//, "mariadb://");
    const dbUrl = new URL(normalizedUrl);
    const adapter = new PrismaMariaDb({
      host: dbUrl.hostname,
      port: Number(dbUrl.port) || 3306,
      user: dbUrl.username,
      password: decodeURIComponent(dbUrl.password),
      database: dbUrl.pathname.replace(/^\//, ""),
      connectTimeout: 10000,
      acquireTimeout: 10000,
    });
    return new PrismaClient({ adapter });
  } catch (e) {
    console.error("Failed to initialize PrismaMariaDb adapter:", e);
    return new PrismaClient();
  }
}

export const db = globalThis.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalThis.prisma = db;
