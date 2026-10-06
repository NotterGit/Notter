import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

let prismaInstance: PrismaClient | undefined;

function createPrismaClient(): PrismaClient {
  const urlString = process.env.DATABASE_URL;
  if (!urlString) {
    const fallbackAdapter = new PrismaMariaDb({
      host: "localhost",
      port: 3306,
      user: "notter",
      password: "",
      database: "notter",
    });
    return new PrismaClient({ adapter: fallbackAdapter });
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
      connectionLimit: 15,
      connectTimeout: 10000,
      acquireTimeout: 10000,
      idleTimeout: 30000,
      compress: true,
    });
    return new PrismaClient({ adapter });
  } catch (e) {
    console.error("Failed to initialize PrismaMariaDb adapter:", e);
    const fallbackAdapter = new PrismaMariaDb({
      host: "localhost",
      port: 3306,
      user: "notter",
      password: "",
      database: "notter",
    });
    return new PrismaClient({ adapter: fallbackAdapter });
  }
}

function getPrismaClient(): PrismaClient {
  if (globalThis.prisma) {
    return globalThis.prisma;
  }
  if (!prismaInstance) {
    prismaInstance = createPrismaClient();
    if (process.env.NODE_ENV !== "production") {
      globalThis.prisma = prismaInstance;
    }
  }
  return prismaInstance;
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (prop === "then" || prop === "$$typeof" || prop === "toJSON") {
      return undefined;
    }
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

