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
  ReadingPlanEnrollment: { plan: { fkCol: "planId", table: "ReadingPlan" }, user: { fkCol: "userId", table: "User" } },
  Friendship: { requester: { fkCol: "requesterId", table: "User" }, addressee: { fkCol: "addresseeId", table: "User" } },
  FriendInviteCode: { user: { fkCol: "userId", table: "User" } },
  LeaderProfile: { user: { fkCol: "userId", table: "User" } },
  Circle: { owner: { fkCol: "ownerId", table: "User" } },
  CircleMember: { circle: { fkCol: "circleId", table: "Circle" }, user: { fkCol: "userId", table: "User" } },
  PrayerRequest: { circle: { fkCol: "circleId", table: "Circle" }, user: { fkCol: "userId", table: "User" } },
  PrayerIntercession: { prayerRequest: { fkCol: "prayerRequestId", table: "PrayerRequest" }, user: { fkCol: "userId", table: "User" } },
  VersePing: { fromUser: { fkCol: "fromUserId", table: "User" }, toUser: { fkCol: "toUserId", table: "User" } },
  WeeklyMission: { circle: { fkCol: "circleId", table: "Circle" }, createdBy: { fkCol: "createdById", table: "User" } },
  MissionCheckIn: { mission: { fkCol: "missionId", table: "WeeklyMission" }, user: { fkCol: "userId", table: "User" } },
  CircleBroadcast: { circle: { fkCol: "circleId", table: "Circle" }, createdBy: { fkCol: "createdById", table: "User" } },
  FavoriteVerse: { user: { fkCol: "userId", table: "User" } },
  PersonalPrayer: { user: { fkCol: "userId", table: "User" } },
  DailyActivity: { user: { fkCol: "userId", table: "User" } },
};

const REVERSE_FK_MAP: Record<string, Record<string, { table: string; fkCol: string }>> = {
  ReadingPlan: { enrollments: { table: "ReadingPlanEnrollment", fkCol: "planId" } },
  ReadingChallenge: { progress: { table: "ChallengeProgress", fkCol: "challengeId" } },
  Circle: {
    members: { table: "CircleMember", fkCol: "circleId" },
    prayers: { table: "PrayerRequest", fkCol: "circleId" },
    missions: { table: "WeeklyMission", fkCol: "circleId" },
    broadcasts: { table: "CircleBroadcast", fkCol: "circleId" },
  },
  PrayerRequest: { intercessions: { table: "PrayerIntercession", fkCol: "prayerRequestId" } },
  WeeklyMission: { checkIns: { table: "MissionCheckIn", fkCol: "missionId" } },
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
      if (rel === "_count" && typeof val === "object" && val !== null) {
        const countSpec = (val as { select?: Record<string, boolean> }).select;
        if (countSpec) {
          const revRels = REVERSE_FK_MAP[table] ?? {};
          for (const countRel of Object.keys(countSpec)) {
            const revInfo = revRels[countRel];
            if (revInfo) {
              parts.push(`_count_${countRel}:${revInfo.table}!${revInfo.fkCol}(id)`);
            }
          }
        }
        continue;
      }
      const info = rels[rel];
      if (info) {
        const nestedSelect = buildNestedSelect(info.table, val);
        parts.push(`${rel}:${info.table}!${info.fkCol}(${nestedSelect})`);
      }
    }
  }
  return parts.join(",");
}

function buildNestedSelect(table: string, val: boolean | object): string {
  if (val === true) return "*";
  if (typeof val === "object" && val !== null) {
    const nested = val as { select?: Record<string, boolean>; include?: Record<string, boolean | object> };
    const parts: string[] = [];
    if (nested.select) {
      parts.push(...Object.keys(nested.select).filter((k) => nested.select![k]));
    } else {
      parts.push("*");
    }
    if (nested.include) {
      const rels = FK_MAP[table] ?? {};
      for (const [rel, relVal] of Object.entries(nested.include)) {
        if (!relVal) continue;
        if (rel === "_count") continue;
        const info = rels[rel];
        if (info) {
          const deepSelect = buildNestedSelect(info.table, relVal);
          parts.push(`${rel}:${info.table}!${info.fkCol}(${deepSelect})`);
        }
      }
    }
    return parts.join(",");
  }
  return "*";
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

function postProcessCounts(row: Record<string, unknown>): Record<string, unknown> {
  const counts: Record<string, number> = {};
  const keysToDelete: string[] = [];
  for (const key of Object.keys(row)) {
    if (key.startsWith("_count_")) {
      const rel = key.slice(7);
      counts[rel] = Array.isArray(row[key]) ? (row[key] as unknown[]).length : 0;
      keysToDelete.push(key);
    }
  }
  for (const k of keysToDelete) delete row[k];
  if (Object.keys(counts).length > 0) row._count = counts;
  return row;
}

async function fetchJson(url: string, init?: RequestInit) {
  const res = await request(url, init);
  if (!res.ok) return null;
  const data = await res.json();
  const revived = reviveDates(data);
  if (Array.isArray(revived)) return revived.map((r) => postProcessCounts(r as Record<string, unknown>));
  if (revived && typeof revived === "object") return postProcessCounts(revived as Record<string, unknown>);
  return revived;
}

/**
 * Tables whose Prisma schema declares @updatedAt — a client-side feature with
 * no DB default, so this adapter must supply the value on create/update.
 *
 * Kept in step with schema.prisma by hand, and it had drifted both ways: it
 * listed PasswordResetToken, which has no such column (any write to that table
 * would be rejected outright), and omitted User, Devotion, Sermon and Circle,
 * whose updatedAt therefore never moved off its creation value.
 */
const UPDATED_AT_TABLES = new Set([
  "User",
  "Devotion",
  "Sermon",
  "WatchProgress",
  "Note",
  "Setting",
  "JournalEntry",
  "Circle",
]);

/**
 * Splits `{ points: { increment: 10 }, name: "x" }` into the plain fields and
 * the numeric deltas, so the deltas can be resolved against current values.
 *
 * prepareData used to `continue` past any increment operand, dropping it while
 * the write still succeeded. That is why User.points sat at 0 and
 * ChallengeProgress.pointsEarned froze after the first chapter: only the create
 * path ever wrote a real number.
 */
function splitAtomicOps(data: Record<string, unknown>) {
  const fields: Record<string, unknown> = {};
  const deltas: Record<string, number> = {};

  for (const [key, val] of Object.entries(data)) {
    if (val && typeof val === "object" && !Array.isArray(val) && !(val instanceof Date)) {
      const op = val as Record<string, unknown>;
      if ("increment" in op) {
        deltas[key] = Number(op.increment) || 0;
        continue;
      }
      if ("decrement" in op) {
        deltas[key] = -(Number(op.decrement) || 0);
        continue;
      }
    }
    fields[key] = val;
  }

  return { fields, deltas };
}

function createModel(modelName: string) {
  const table = toTableName(modelName);

  /**
   * Turns `{ increment: n }` into an absolute value.
   *
   * PostgREST cannot express `col = col + n` over the table API, so this reads
   * the row and writes back the sum. It is a read-modify-write, so two awards
   * landing at the same instant can still collide — but the previous behaviour
   * was to discard the operation entirely. Move this to a SQL function (like the
   * existing auth_* RPCs) if these counters ever become contended.
   */
  async function resolveDeltas(where: Record<string, unknown>, deltas: Record<string, number>) {
    const columns = Object.keys(deltas);
    if (columns.length === 0) return {};

    const url = `${BASE}/${table}?${buildWhere(where)}&select=${encodeURIComponent(columns.join(","))}&limit=1`;
    const rows = await fetchJson(url, { headers: { Accept: "application/json" } });
    const current = ((rows as Record<string, unknown>[] | null)?.[0] ?? {}) as Record<string, unknown>;

    const resolved: Record<string, number> = {};
    for (const col of columns) {
      const value = Number(current[col]);
      resolved[col] = (Number.isFinite(value) ? value : 0) + deltas[col];
    }
    return resolved;
  }

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
      // Prisma @default(cuid()) and @updatedAt are client-side — supply them here.
      if (body.id === undefined) body.id = crypto.randomUUID();
      if (UPDATED_AT_TABLES.has(table) && body.updatedAt === undefined) body.updatedAt = new Date().toISOString();
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
      const { fields, deltas } = splitAtomicOps(args.data);
      const body = prepareData(fields);
      Object.assign(body, await resolveDeltas(args.where, deltas));
      if (UPDATED_AT_TABLES.has(table) && body.updatedAt === undefined) body.updatedAt = new Date().toISOString();
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

    /**
     * Prisma-style aggregate.
     *
     * This method did not exist: the Proxy handed back a model object without
     * it, so `prisma.devotion.aggregate(...)` resolved to undefined and the
     * contributor dashboard threw on `viewsAgg._sum` every time it loaded.
     *
     * PostgREST can aggregate server-side, but only over columns explicitly
     * exposed for it, so the columns are fetched and folded here. Fine for the
     * per-author scopes this is used with; a large scope should get a view.
     */
    async aggregate(args: {
      where?: Record<string, unknown>;
      _sum?: Record<string, boolean>;
      _avg?: Record<string, boolean>;
      _min?: Record<string, boolean>;
      _max?: Record<string, boolean>;
    }) {
      const columns = new Set<string>();
      for (const spec of [args._sum, args._avg, args._min, args._max]) {
        if (spec) for (const [col, on] of Object.entries(spec)) if (on) columns.add(col);
      }

      const selected = columns.size > 0 ? [...columns].join(",") : "id";
      const where = buildWhere(args.where);
      let url = `${BASE}/${table}?select=${encodeURIComponent(selected)}`;
      if (where) url += `&${where}`;

      const rows = ((await fetchJson(url, { headers: { Accept: "application/json" } })) ?? []) as Record<string, unknown>[];
      const numbersIn = (col: string) => rows.map((r) => Number(r[col])).filter((n) => Number.isFinite(n));

      const fold = (
        spec: Record<string, boolean> | undefined,
        reduce: (values: number[]) => number | null,
      ) => {
        const out: Record<string, number | null> = {};
        if (!spec) return out;
        for (const [col, on] of Object.entries(spec)) {
          if (!on) continue;
          const values = numbersIn(col);
          out[col] = values.length === 0 ? null : reduce(values);
        }
        return out;
      };

      return {
        _sum: fold(args._sum, (v) => v.reduce((a, b) => a + b, 0)),
        _avg: fold(args._avg, (v) => v.reduce((a, b) => a + b, 0) / v.length),
        _min: fold(args._min, (v) => Math.min(...v)),
        _max: fold(args._max, (v) => Math.max(...v)),
        _count: rows.length,
      };
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
    // increment/decrement never reach here — update() resolves them against the
    // current row first (see splitAtomicOps). A create() carrying one would be a
    // caller mistake, and letting it through as an object is a louder failure
    // than silently dropping the field.
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
