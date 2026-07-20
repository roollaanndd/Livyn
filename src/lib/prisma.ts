/* PostgREST-based adapter that exposes a Prisma-compatible API.
 * Bypasses the broken Supavisor connection pooler by using HTTP. */

const SUPABASE_URL = (() => {
  if (process.env.SUPABASE_URL) return process.env.SUPABASE_URL;
  const dbUrl = process.env.DATABASE_URL ?? "";
  const m = dbUrl.match(/\/\/[^.]+\.([a-z]{20})[.:@]/) ?? dbUrl.match(/db\.([a-z]{20})\.supabase/);
  return m ? `https://${m[1]}.supabase.co` : "";
})();

const SUPABASE_KEY =
  process.env.SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jdG5vbmd1ZGt1eWNvb3BieG9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0NDg5NzMsImV4cCI6MjEwMDAyNDk3M30.XwSmLiWGc3L2RRMBGHcrNl0AFS2OEZuO3qABa718e0M";

const BASE = `${SUPABASE_URL}/rest/v1`;

// FK relationships: relation name → { fkCol, targetTable }
const FK_MAP: Record<string, Record<string, { fkCol: string; table: string }>> = {
  BibleVerse: { book: { fkCol: "bookId", table: "BibleBook" } },
  Devotion: { author: { fkCol: "authorId", table: "User" }, category: { fkCol: "categoryId", table: "Category" } },
  Sermon: { author: { fkCol: "authorId", table: "User" }, category: { fkCol: "categoryId", table: "Category" } },
  WatchProgress: { sermon: { fkCol: "sermonId", table: "Sermon" }, user: { fkCol: "userId", table: "User" } },
  JournalEntry: { suggestedVerse: { fkCol: "suggestedVerseId", table: "BibleVerse" }, user: { fkCol: "userId", table: "User" } },
  PrayerLog: { reminder: { fkCol: "reminderId", table: "PrayerReminder" }, user: { fkCol: "userId", table: "User" } },
  PrayerReminder: { user: { fkCol: "userId", table: "User" } },
  ChallengeProgress: { challenge: { fkCol: "challengeId", table: "ReadingChallenge" }, user: { fkCol: "userId", table: "User" } },
  Bookmark: { devotion: { fkCol: "devotionId", table: "Devotion" }, user: { fkCol: "userId", table: "User" } },
  Highlight: { user: { fkCol: "userId", table: "User" } },
  Note: { user: { fkCol: "userId", table: "User" } },
  Notification: { user: { fkCol: "userId", table: "User" } },
  Report: { filedBy: { fkCol: "filedById", table: "User" } },
  ModerationAction: { moderator: { fkCol: "moderatorId", table: "User" } },
  RefreshToken: { user: { fkCol: "userId", table: "User" } },
  LoginEvent: { user: { fkCol: "userId", table: "User" } },
  AuditLog: { user: { fkCol: "userId", table: "User" } },
  Device: { user: { fkCol: "userId", table: "User" } },
  ContributorProfile: { user: { fkCol: "userId", table: "User" } },
  Session: { user: { fkCol: "userId", table: "User" } },
  PushSubscription: { user: { fkCol: "userId", table: "User" } },
};

function toTableName(model: string): string {
  return model.charAt(0).toUpperCase() + model.slice(1);
}

function buildSelect(table: string, opts: { select?: Record<string, boolean> | null; include?: Record<string, boolean | object> | null }): string {
  const parts: string[] = [];
  if (opts.select) {
    parts.push(...Object.keys(opts.select).filter((k) => opts.select![k]));
  } else {
    parts.push("*");
  }
  if (opts.include) {
    const rels = FK_MAP[table] ?? {};
    for (const [rel, val] of Object.entries(opts.include)) {
      if (!val) continue;
      const info = rels[rel];
      if (info) {
        parts.push(`${rel}:${info.table}!${info.fkCol}(*)`);
      }
    }
  }
  return parts.join(",");
}

function buildWhere(where: Record<string, unknown> | undefined | null): string {
  if (!where) return "";
  const params: string[] = [];
  for (const [key, val] of Object.entries(where)) {
    if (key === "AND" && Array.isArray(val)) {
      for (const clause of val) params.push(buildWhere(clause as Record<string, unknown>));
      continue;
    }
    if (key === "OR" && Array.isArray(val)) {
      const orParts = (val as Record<string, unknown>[]).map((c) => {
        const inner: string[] = [];
        for (const [k, v] of Object.entries(c)) inner.push(buildFilter(k, v));
        return inner.join(",");
      });
      params.push(`or=(${orParts.join(",")})`);
      continue;
    }
    if (key === "NOT" && val && typeof val === "object") {
      for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
        params.push(`${k}=not.eq.${encodeVal(v)}`);
      }
      continue;
    }
    // Compound unique key (e.g. userId_challengeId: { userId: "x", challengeId: "y" })
    if (val && typeof val === "object" && !Array.isArray(val) && isCompoundKey(key, val as Record<string, unknown>)) {
      for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
        params.push(`${k}=eq.${encodeVal(v)}`);
      }
      continue;
    }
    params.push(buildFilter(key, val));
  }
  return params.filter(Boolean).join("&");
}

function isCompoundKey(key: string, val: Record<string, unknown>): boolean {
  return key.includes("_") && Object.keys(val).every((k) => typeof val[k] === "string" || typeof val[k] === "number");
}

function buildFilter(key: string, val: unknown): string {
  if (val === null || val === undefined) return `${key}=is.null`;
  if (typeof val === "object" && !Array.isArray(val) && !(val instanceof Date)) {
    const op = val as Record<string, unknown>;
    if ("equals" in op) return `${key}=eq.${encodeVal(op.equals)}`;
    if ("not" in op) return op.not === null ? `${key}=not.is.null` : `${key}=neq.${encodeVal(op.not)}`;
    if ("in" in op) return `${key}=in.(${(op.in as unknown[]).map(encodeVal).join(",")})`;
    if ("notIn" in op) return `${key}=not.in.(${(op.notIn as unknown[]).map(encodeVal).join(",")})`;
    if ("contains" in op) return `${key}=ilike.*${op.contains}*`;
    if ("startsWith" in op) return `${key}=ilike.${op.startsWith}*`;
    if ("gt" in op) return `${key}=gt.${encodeVal(op.gt)}`;
    if ("gte" in op) return `${key}=gte.${encodeVal(op.gte)}`;
    if ("lt" in op) return `${key}=lt.${encodeVal(op.lt)}`;
    if ("lte" in op) return `${key}=lte.${encodeVal(op.lte)}`;
    return `${key}=eq.${encodeVal(val)}`;
  }
  if (val instanceof Date) return `${key}=eq.${val.toISOString()}`;
  return `${key}=eq.${encodeVal(val)}`;
}

function encodeVal(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

function buildOrderBy(orderBy: unknown): string {
  if (!orderBy) return "";
  if (Array.isArray(orderBy)) {
    return orderBy.map((o) => buildOrderBy(o)).filter(Boolean).join(",");
  }
  if (typeof orderBy === "object" && orderBy) {
    return Object.entries(orderBy as Record<string, string>)
      .map(([col, dir]) => `${col}.${dir}`)
      .join(",");
  }
  return "";
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;

function reviveDates(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "string" && ISO_DATE_RE.test(obj)) return new Date(obj);
  if (Array.isArray(obj)) return obj.map(reviveDates);
  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      result[k] = reviveDates(v);
    }
    return result;
  }
  return obj;
}

async function request(url: string, init?: RequestInit): Promise<Response> {
  const headers: Record<string, string> = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> ?? {}),
  };
  return fetch(url, { ...init, headers });
}

async function fetchJson(url: string, init?: RequestInit) {
  const res = await request(url, init);
  if (!res.ok) return null;
  const data = await res.json();
  return reviveDates(data);
}

function createModel(modelName: string) {
  const table = toTableName(modelName);

  return {
    async findUnique(args: { where: Record<string, unknown>; select?: Record<string, boolean>; include?: Record<string, boolean | object> }) {
      const sel = buildSelect(table, args);
      const where = buildWhere(args.where);
      const url = `${BASE}/${table}?${where}&select=${encodeURIComponent(sel)}&limit=1`;
      const rows = await fetchJson(url, { headers: { Accept: "application/json" } });
      return (rows as unknown[])?.[0] ?? null;
    },

    async findFirst(args?: { where?: Record<string, unknown>; select?: Record<string, boolean>; include?: Record<string, boolean | object>; orderBy?: unknown }) {
      const sel = buildSelect(table, args ?? {});
      const where = buildWhere(args?.where);
      const order = buildOrderBy(args?.orderBy);
      let url = `${BASE}/${table}?select=${encodeURIComponent(sel)}&limit=1`;
      if (where) url += `&${where}`;
      if (order) url += `&order=${encodeURIComponent(order)}`;
      const rows = await fetchJson(url, { headers: { Accept: "application/json" } });
      return (rows as unknown[])?.[0] ?? null;
    },

    async findMany(args?: { where?: Record<string, unknown>; select?: Record<string, boolean>; include?: Record<string, boolean | object>; orderBy?: unknown; take?: number; skip?: number; distinct?: unknown }) {
      const sel = buildSelect(table, args ?? {});
      const where = buildWhere(args?.where);
      const order = buildOrderBy(args?.orderBy);
      let url = `${BASE}/${table}?select=${encodeURIComponent(sel)}`;
      if (where) url += `&${where}`;
      if (order) url += `&order=${encodeURIComponent(order)}`;
      if (args?.take) url += `&limit=${args.take}`;
      if (args?.skip) url += `&offset=${args.skip}`;
      const rows = await fetchJson(url, { headers: { Accept: "application/json" } });
      return rows ?? [];
    },

    async create(args: { data: Record<string, unknown>; select?: Record<string, boolean>; include?: Record<string, boolean | object> }) {
      const sel = buildSelect(table, args);
      const url = `${BASE}/${table}?select=${encodeURIComponent(sel)}`;
      const body = prepareData(args.data);
      const res = await request(url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { Accept: "application/json", Prefer: "return=representation" },
      });
      if (!res.ok) throw new Error(`create ${table}: ${res.status} ${await res.text()}`);
      const rows = await res.json();
      return reviveDates(rows[0]);
    },

    async update(args: { where: Record<string, unknown>; data: Record<string, unknown>; select?: Record<string, boolean>; include?: Record<string, boolean | object> }) {
      const sel = buildSelect(table, args);
      const where = buildWhere(args.where);
      const body = prepareData(args.data);
      const url = `${BASE}/${table}?${where}&select=${encodeURIComponent(sel)}`;
      const res = await request(url, {
        method: "PATCH",
        body: JSON.stringify(body),
        headers: { Accept: "application/json", Prefer: "return=representation" },
      });
      if (!res.ok) throw new Error(`update ${table}: ${res.status} ${await res.text()}`);
      const rows = await res.json();
      return reviveDates(rows[0]) ?? null;
    },

    async updateMany(args: { where?: Record<string, unknown>; data: Record<string, unknown> }) {
      const where = buildWhere(args.where);
      const body = prepareData(args.data);
      const url = `${BASE}/${table}?${where}`;
      const res = await request(url, {
        method: "PATCH",
        body: JSON.stringify(body),
        headers: { Accept: "application/json", Prefer: "return=minimal,count=exact" },
      });
      const count = parseInt(res.headers.get("content-range")?.split("/")?.[1] ?? "0", 10) || 0;
      return { count };
    },

    async delete(args: { where: Record<string, unknown> }) {
      const where = buildWhere(args.where);
      const url = `${BASE}/${table}?${where}`;
      const res = await request(url, {
        method: "DELETE",
        headers: { Accept: "application/json", Prefer: "return=representation" },
      });
      if (!res.ok) return null;
      const rows = await res.json();
      return reviveDates(rows[0]) ?? null;
    },

    async deleteMany(args?: { where?: Record<string, unknown> }) {
      const where = buildWhere(args?.where);
      const url = `${BASE}/${table}?${where}`;
      const res = await request(url, {
        method: "DELETE",
        headers: { Prefer: "return=minimal,count=exact" },
      });
      const count = parseInt(res.headers.get("content-range")?.split("/")?.[1] ?? "0", 10) || 0;
      return { count };
    },

    async count(args?: { where?: Record<string, unknown> }) {
      const where = buildWhere(args?.where);
      let url = `${BASE}/${table}?select=id`;
      if (where) url += `&${where}`;
      const res = await request(url, {
        method: "HEAD",
        headers: { Prefer: "count=exact" },
      });
      const range = res.headers.get("content-range") ?? "";
      const total = range.split("/")[1];
      return total ? parseInt(total, 10) : 0;
    },

    async upsert(args: { where: Record<string, unknown>; create: Record<string, unknown>; update: Record<string, unknown>; select?: Record<string, boolean>; include?: Record<string, boolean | object> }) {
      const existing = await this.findUnique({ where: args.where, select: { id: true } });
      if (existing) {
        return this.update({ where: args.where, data: args.update, select: args.select, include: args.include });
      }
      return this.create({ data: args.create, select: args.select, include: args.include });
    },
  };
}

function prepareData(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(data)) {
    if (val && typeof val === "object" && "increment" in (val as Record<string, unknown>)) {
      // Prisma increment — handled via RPC later if needed; skip for now
      continue;
    }
    if (val && typeof val === "object" && "set" in (val as Record<string, unknown>)) {
      result[key] = (val as Record<string, unknown>).set;
      continue;
    }
    if (val instanceof Date) {
      result[key] = val.toISOString();
      continue;
    }
    // Skip relation objects (e.g. { connect: { id: "..." } })
    if (val && typeof val === "object" && ("connect" in (val as Record<string, unknown>) || "create" in (val as Record<string, unknown>))) {
      const connect = (val as Record<string, unknown>).connect as Record<string, unknown> | undefined;
      if (connect?.id) result[`${key}Id`] = connect.id;
      continue;
    }
    result[key] = val;
  }
  return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handler: ProxyHandler<any> = {
  get(_target, prop: string) {
    if (prop === "$transaction") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return async (ops: any[] | ((tx: any) => any)) => {
        if (typeof ops === "function") {
          return ops(prisma);
        }
        return Promise.all(ops);
      };
    }
    if (prop === "$connect" || prop === "$disconnect") return () => Promise.resolve();
    if (prop.startsWith("$")) return undefined;
    return createModel(prop);
  },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const prisma: any = new Proxy({}, handler);
