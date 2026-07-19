import { PrismaClient } from "@prisma/client";

function buildDatasourceUrl(): string | undefined {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;

  try {
    const url = new URL(raw);

    // Supabase pooler URLs use "role.project-ref" as the username and
    // connect to *.pooler.supabase.com on port 6543. Supavisor can
    // intermittently fail to resolve custom roles. Convert pooler URLs to
    // direct connection (db.project-ref.supabase.co:5432) for reliability,
    // and add pgbouncer=true to prevent "prepared statement already exists".
    if (url.hostname.endsWith(".pooler.supabase.com")) {
      const [role, projectRef] = url.username.split(".");
      if (role && projectRef) {
        url.hostname = `db.${projectRef}.supabase.co`;
        url.port = "5432";
        url.username = role;
        url.searchParams.set("pgbouncer", "true");
      }
    }

    // Ensure pgbouncer param is set for any pooled connection
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
