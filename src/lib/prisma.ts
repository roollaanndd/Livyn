/* PostgREST-based adapter that exposes a Prisma-compatible API.
 * Bypasses the broken Supavisor connection pooler by using HTTP. */

import { supabaseKey, supabaseUrl } from "@/lib/env";

/**
 * A returned row.
 *
 * Deliberately `any`: a row's shape depends on the `select`/`include` passed at
 * the call site, so there is no one static type for it, and every caller here
 * hands rows straight to a locally declared interface. What this file *does*
 * pin down is the shape of the API around the rows — which methods exist, what
 * arguments they take, and that `findMany` yields an array while `findUnique`
 * yields one row. That is what the previous `export const prisma: any` gave up,
 * and it is why `prisma.user.findmany(...)` or a misspelled argument used to
 * compile.
 *
 * Typing the rows themselves means declaring an interface per model and
 * threading it through as a generic — worth doing, and larger than this file.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DbRecord = any;

type WhereInput = Record<string, unknown>;
type SelectInput = Record<string, boolean>;
type IncludeInput = Record<string, boolean | object>;
type DataInput = Record<string, unknown>;

type FindUniqueArgs = { where: WhereInput; select?: SelectInput; include?: IncludeInput };
type FindFirstArgs = { where?: WhereInput; select?: SelectInput; include?: IncludeInput; orderBy?: unknown };
type FindManyArgs = FindFirstArgs & { take?: number; skip?: number; distinct?: unknown };
type CreateArgs = { data: DataInput; select?: SelectInput; include?: IncludeInput };
type UpdateArgs = { where: WhereInput; data: DataInput; select?: SelectInput; include?: IncludeInput };
type UpsertArgs = {
  where: WhereInput;
  create: DataInput;
  update: DataInput;
  select?: SelectInput;
  include?: IncludeInput;
};

type AggregateArgs = {
  where?: WhereInput;
  _sum?: Record<string, boolean>;
  _avg?: Record<string, boolean>;
  _min?: Record<string, boolean>;
  _max?: Record<string, boolean>;
  _count?: Record<string, boolean> | true;
};

type AggregateResult = {
  _sum: Record<string, number | null>;
  _avg: Record<string, number | null>;
  _min: Record<string, number | null>;
  _max: Record<string, number | null>;
  _count: number;
};

export interface DbModel {
  findUnique(args: FindUniqueArgs): Promise<DbRecord | null>;
  findFirst(args?: FindFirstArgs): Promise<DbRecord | null>;
  findMany(args?: FindManyArgs): Promise<DbRecord[]>;
  create(args: CreateArgs): Promise<DbRecord>;
  update(args: UpdateArgs): Promise<DbRecord | null>;
  updateMany(args: { where?: WhereInput; data: DataInput }): Promise<{ count: number }>;
  delete(args: { where: WhereInput }): Promise<DbRecord | null>;
  deleteMany(args?: { where?: WhereInput }): Promise<{ count: number }>;
  count(args?: { where?: WhereInput }): Promise<number>;
  aggregate(args: AggregateArgs): Promise<AggregateResult>;
  upsert(args: UpsertArgs): Promise<DbRecord>;
}

export type Db = { [model: string]: DbModel } & {
  $transaction: {
    <T>(fn: (tx: Db) => Promise<T>): Promise<T>;
    <T>(ops: Promise<T>[]): Promise<T[]>;
  };
  $connect(): Promise<void>;
  $disconnect(): Promise<void>;
};

function base(): string {
  return `${supabaseUrl()}/rest/v1`;
}

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

/* ------------------------------------------------------------------------- *
 * Query-string encoding
 *
 * Everything user-supplied that reaches a PostgREST URL goes through these.
 * Without them a value containing `&` ends the current filter and starts a new
 * parameter: a search for `x&status=eq.draft` would append a real filter and
 * hand back unpublished rows. `encodeURIComponent` alone is not enough because
 * it leaves `!'()*` intact, and `(`/`)` are structural inside `in.(...)`.
 * ------------------------------------------------------------------------- */

/** RFC 3986 encoding: everything outside the unreserved set is percent-escaped. */
function encodeComponent(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

/**
 * PostgREST parses the contents of `in.(...)` and `or=(...)` with its own
 * grammar after percent-decoding, so commas and parentheses inside a value
 * still need its native quoting on top of the encoding.
 */
function quoteForList(value: unknown): string {
  const raw = scalarToString(value);
  return encodeComponent(`"${raw.replace(/([\\"])/g, "\\$1")}"`);
}

function scalarToString(v: unknown): string {
  if (v instanceof Date) return v.toISOString();
  if (v === null || v === undefined) return "";
  return String(v);
}

/** Column and relation names are identifiers; encoding them is belt-and-braces. */
function encodeColumn(name: string): string {
  return encodeComponent(name);
}

function encodeVal(v: unknown): string {
  return encodeComponent(scalarToString(v));
}

function buildSelect(table: string, opts: { select?: SelectInput | null; include?: IncludeInput | null }): string {
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
    const nested = val as { select?: Record<string, boolean>; include?: IncludeInput };
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

export function buildWhere(where: WhereInput | undefined | null): string {
  if (!where) return "";
  const params: string[] = [];
  for (const [key, val] of Object.entries(where)) {
    if (key === "AND" && Array.isArray(val)) {
      for (const clause of val) params.push(buildWhere(clause as WhereInput));
      continue;
    }
    if (key === "OR" && Array.isArray(val)) {
      const orParts = (val as WhereInput[]).map((c) => {
        const inner: string[] = [];
        for (const [k, v] of Object.entries(c)) inner.push(buildOrFilter(k, v));
        return inner.join(",");
      });
      params.push(`or=(${orParts.join(",")})`);
      continue;
    }
    if (key === "NOT" && val && typeof val === "object") {
      for (const [k, v] of Object.entries(val as WhereInput)) {
        params.push(`${encodeColumn(k)}=not.eq.${encodeVal(v)}`);
      }
      continue;
    }
    // Compound unique key (e.g. userId_challengeId: { userId: "x", challengeId: "y" })
    if (val && typeof val === "object" && !Array.isArray(val) && isCompoundKey(key, val as WhereInput)) {
      for (const [k, v] of Object.entries(val as WhereInput)) {
        params.push(`${encodeColumn(k)}=eq.${encodeVal(v)}`);
      }
      continue;
    }
    params.push(buildFilter(key, val));
  }
  return params.filter(Boolean).join("&");
}

function isCompoundKey(key: string, val: WhereInput): boolean {
  return key.includes("_") && Object.keys(val).every((k) => typeof val[k] === "string" || typeof val[k] === "number");
}

/** `column=operator.value`, with the value encoded so it cannot escape its slot. */
export function buildFilter(key: string, val: unknown): string {
  const col = encodeColumn(key);
  return `${col}=${buildPredicate(val)}`;
}

/**
 * Inside `or=(...)` the separator is a comma rather than `&`, and PostgREST
 * wants `column.operator.value` instead of `column=operator.value`.
 */
function buildOrFilter(key: string, val: unknown): string {
  return `${encodeColumn(key)}.${buildPredicate(val, true)}`;
}

function buildPredicate(val: unknown, inGroup = false): string {
  if (val === null || val === undefined) return "is.null";

  if (typeof val === "object" && !Array.isArray(val) && !(val instanceof Date)) {
    const op = val as Record<string, unknown>;
    const quote = inGroup ? quoteForList : encodeVal;
    if ("equals" in op) return `eq.${quote(op.equals)}`;
    if ("not" in op) return op.not === null ? "not.is.null" : `neq.${quote(op.not)}`;
    if ("in" in op) return `in.(${(op.in as unknown[]).map(quoteForList).join(",")})`;
    if ("notIn" in op) return `not.in.(${(op.notIn as unknown[]).map(quoteForList).join(",")})`;
    // `*` is PostgREST's wildcard for like/ilike; the surrounding pair is ours,
    // and anything the caller passed is encoded so it cannot add filters.
    if ("contains" in op) return likePredicate(`*${scalarToString(op.contains)}*`, inGroup);
    if ("startsWith" in op) return likePredicate(`${scalarToString(op.startsWith)}*`, inGroup);
    if ("gt" in op) return `gt.${quote(op.gt)}`;
    if ("gte" in op) return `gte.${quote(op.gte)}`;
    if ("lt" in op) return `lt.${quote(op.lt)}`;
    if ("lte" in op) return `lte.${quote(op.lte)}`;
    return `eq.${quote(val)}`;
  }

  if (inGroup) return `eq.${quoteForList(val)}`;
  return `eq.${encodeVal(val)}`;
}

function likePredicate(pattern: string, inGroup: boolean): string {
  if (!inGroup) {
    // Keep our own `*` literal, encode the rest of the pattern.
    return `ilike.${pattern.split("*").map(encodeComponent).join("*")}`;
  }
  return `ilike.${quoteForList(pattern)}`;
}

function buildOrderBy(orderBy: unknown): string {
  if (!orderBy) return "";
  if (Array.isArray(orderBy)) {
    return orderBy.map((o) => buildOrderBy(o)).filter(Boolean).join(",");
  }
  if (typeof orderBy === "object" && orderBy) {
    return Object.entries(orderBy as Record<string, string>)
      .map(([col, dir]) => `${col}.${dir === "desc" ? "desc" : "asc"}`)
      .join(",");
  }
  return "";
}

/** Only whole, non-negative numbers reach `limit`/`offset`. */
function positiveInt(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.floor(n);
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
  const key = supabaseKey();
  const headers: Record<string, string> = {
    apikey: key,
    Authorization: `Bearer ${key}`,
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
  if (!res.ok) {
    // A failed read used to be indistinguishable from an empty table. Callers
    // still get null/[] so a hiccup degrades rather than crashes, but the cause
    // now shows up in the logs.
    const detail = await res.text().catch(() => "");
    console.error(`[db] ${init?.method ?? "GET"} ${url} -> ${res.status} ${detail}`);
    return null;
  }
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
 * would have been rejected), and omitted User, Devotion, Sermon and Circle,
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
 * Splits `{ views: { increment: 1 }, title: "x" }` into the plain fields and
 * the numeric deltas, so the deltas can be resolved against current values.
 */
function splitAtomicOps(data: DataInput): { fields: DataInput; deltas: Record<string, number> } {
  const fields: DataInput = {};
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

function prepareData(data: DataInput): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(data)) {
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

function createModel(modelName: string): DbModel {
  const table = toTableName(modelName);

  /**
   * Resolves `{ increment: n }` deltas into absolute values.
   *
   * PostgREST cannot express `col = col + n` over the table API, so this reads
   * the row and writes back the sum. That is a read-modify-write and two
   * concurrent awards can therefore collide — but the previous behaviour was to
   * drop the operation entirely, which meant points and view counts never moved
   * at all. Move this to a SQL function (like the auth_* RPCs) if the counters
   * ever become contended.
   */
  async function resolveDeltas(
    where: WhereInput,
    deltas: Record<string, number>,
  ): Promise<Record<string, number>> {
    const columns = Object.keys(deltas);
    if (columns.length === 0) return {};

    const whereClause = buildWhere(where);
    const url = `${base()}/${table}?${whereClause}&select=${encodeComponent(columns.join(","))}&limit=1`;
    const rows = await fetchJson(url, { headers: { Accept: "application/json" } });
    const current = (rows as DbRecord[] | null)?.[0] ?? {};

    const resolved: Record<string, number> = {};
    for (const col of columns) {
      const currentValue = Number(current[col]);
      resolved[col] = (Number.isFinite(currentValue) ? currentValue : 0) + deltas[col];
    }
    return resolved;
  }

  const model: DbModel = {
    async findUnique(args) {
      const sel = buildSelect(table, args);
      const where = buildWhere(args.where);
      const url = `${base()}/${table}?${where}&select=${encodeURIComponent(sel)}&limit=1`;
      const rows = await fetchJson(url, { headers: { Accept: "application/json" } });
      return (rows as DbRecord[] | null)?.[0] ?? null;
    },

    async findFirst(args) {
      const sel = buildSelect(table, args ?? {});
      const where = buildWhere(args?.where);
      const order = buildOrderBy(args?.orderBy);
      let url = `${base()}/${table}?select=${encodeURIComponent(sel)}&limit=1`;
      if (where) url += `&${where}`;
      if (order) url += `&order=${encodeURIComponent(order)}`;
      const rows = await fetchJson(url, { headers: { Accept: "application/json" } });
      return (rows as DbRecord[] | null)?.[0] ?? null;
    },

    async findMany(args) {
      const sel = buildSelect(table, args ?? {});
      const where = buildWhere(args?.where);
      const order = buildOrderBy(args?.orderBy);
      let url = `${base()}/${table}?select=${encodeURIComponent(sel)}`;
      if (where) url += `&${where}`;
      if (order) url += `&order=${encodeURIComponent(order)}`;
      const take = positiveInt(args?.take);
      const skip = positiveInt(args?.skip);
      if (take !== null) url += `&limit=${take}`;
      if (skip !== null && skip > 0) url += `&offset=${skip}`;
      const rows = await fetchJson(url, { headers: { Accept: "application/json" } });
      return Array.isArray(rows) ? (rows as DbRecord[]) : [];
    },

    async create(args) {
      const sel = buildSelect(table, args);
      const url = `${base()}/${table}?select=${encodeURIComponent(sel)}`;
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
      return reviveDates(rows[0]) as DbRecord;
    },

    async update(args) {
      const sel = buildSelect(table, args);
      const where = buildWhere(args.where);
      const { fields, deltas } = splitAtomicOps(args.data);
      const body = prepareData(fields);
      Object.assign(body, await resolveDeltas(args.where, deltas));
      if (UPDATED_AT_TABLES.has(table) && body.updatedAt === undefined) body.updatedAt = new Date().toISOString();
      const url = `${base()}/${table}?${where}&select=${encodeURIComponent(sel)}`;
      const res = await request(url, {
        method: "PATCH",
        body: JSON.stringify(body),
        headers: { Accept: "application/json", Prefer: "return=representation" },
      });
      if (!res.ok) throw new Error(`update ${table}: ${res.status} ${await res.text()}`);
      const rows = await res.json();
      return (reviveDates(rows[0]) as DbRecord) ?? null;
    },

    async updateMany(args) {
      const { fields, deltas } = splitAtomicOps(args.data);
      if (Object.keys(deltas).length > 0) {
        // Each matched row needs its own base value, which one PATCH cannot
        // express. Refuse loudly rather than write the wrong number.
        throw new Error(
          `updateMany ${table}: increment/decrement is not supported across multiple rows — ` +
            "update rows individually or add a SQL function for it.",
        );
      }
      const where = buildWhere(args.where);
      const body = prepareData(fields);
      const url = `${base()}/${table}?${where}`;
      const res = await request(url, {
        method: "PATCH",
        body: JSON.stringify(body),
        headers: { Accept: "application/json", Prefer: "return=minimal,count=exact" },
      });
      const count = parseInt(res.headers.get("content-range")?.split("/")?.[1] ?? "0", 10) || 0;
      return { count };
    },

    async delete(args) {
      const where = buildWhere(args.where);
      const url = `${base()}/${table}?${where}`;
      const res = await request(url, {
        method: "DELETE",
        headers: { Accept: "application/json", Prefer: "return=representation" },
      });
      if (!res.ok) return null;
      const rows = await res.json();
      return (reviveDates(rows[0]) as DbRecord) ?? null;
    },

    async deleteMany(args) {
      const where = buildWhere(args?.where);
      const url = `${base()}/${table}?${where}`;
      const res = await request(url, {
        method: "DELETE",
        headers: { Prefer: "return=minimal,count=exact" },
      });
      const count = parseInt(res.headers.get("content-range")?.split("/")?.[1] ?? "0", 10) || 0;
      return { count };
    },

    async count(args) {
      const where = buildWhere(args?.where);
      let url = `${base()}/${table}?select=id`;
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
     * This method simply did not exist before — the Proxy handed back a model
     * object without it, so `prisma.devotion.aggregate(...)` resolved to
     * undefined and the contributor dashboard died on `viewsAgg._sum` every time
     * it loaded. `any` on the client was hiding that from the compiler.
     *
     * PostgREST can aggregate server-side, but only over columns exposed for it,
     * so the columns are fetched and folded here instead. Fine for the
     * per-author scopes this is used with; a large scope should get a view.
     */
    async aggregate(args) {
      const columns = new Set<string>();
      for (const spec of [args._sum, args._avg, args._min, args._max]) {
        if (spec) for (const [col, on] of Object.entries(spec)) if (on) columns.add(col);
      }

      const selected = columns.size > 0 ? [...columns].join(",") : "id";
      const whereClause = buildWhere(args.where);
      let url = `${base()}/${table}?select=${encodeComponent(selected)}`;
      if (whereClause) url += `&${whereClause}`;

      const rows = ((await fetchJson(url, { headers: { Accept: "application/json" } })) ?? []) as DbRecord[];
      const numbersIn = (col: string) =>
        rows.map((row) => Number(row[col])).filter((n) => Number.isFinite(n));

      const fold = (
        spec: Record<string, boolean> | undefined,
        reduce: (values: number[]) => number | null,
      ): Record<string, number | null> => {
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

    async upsert(args) {
      // Read-then-write, so two simultaneous upserts of the same key can both
      // miss and both insert. The unique index is what ultimately protects the
      // row; the loser surfaces as a failed create.
      const existing = await model.findUnique({ where: args.where, select: { id: true } });
      if (existing) {
        return (await model.update({
          where: args.where,
          data: args.update,
          select: args.select,
          include: args.include,
        })) as DbRecord;
      }
      return model.create({ data: args.create, select: args.select, include: args.include });
    },
  };

  return model;
}

const handler: ProxyHandler<Record<string, never>> = {
  get(_target, prop: string) {
    if (prop === "$transaction") {
      // Not a transaction. PostgREST has no cross-request transaction, so this
      // only groups the calls: a failure halfway through leaves earlier writes
      // committed. Callers that need all-or-nothing need a SQL function.
      return async (ops: Promise<unknown>[] | ((tx: Db) => Promise<unknown>)) => {
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

export const prisma = new Proxy({}, handler) as unknown as Db;
