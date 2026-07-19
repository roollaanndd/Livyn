import { PrismaClient } from "@prisma/client";

function buildDatasourceUrl(): string | undefined {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;

  try {
    const url = new URL(raw);

    // Supabase pooler: switch custom roles to "postgres" which Supavisor
    // always recognizes. Keep the pooler host (direct port 5432 is blocked
    // from Vercel serverless).
    if (url.hostname.endsWith(".pooler.supabase.com")) {
      const parts = url.username.split(".");
      const projectRef = parts[parts.length - 1];
      if (projectRef) {
        url.username = `postgres.${projectRef}`;
      }
      url.searchParams.set("pgbouncer", "true");
    }

    if (url.port === "6543" && !url.searchParams.has("pgbouncer")) {
      url.searchParams.set("pgbouncer", "true");
    }

    return url.toString();
  } catch {
    return raw;
  }
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const datasourceUrl = buildDatasourceUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    ...(datasourceUrl ? { datasourceUrl } : {}),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
