const SUPABASE_URL =
  process.env.SUPABASE_URL ??
  (() => {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) return "";
    // Pooler format: postgresql://[user].[project_ref]:[pw]@...pooler.supabase.com
    // Direct format: postgresql://...@db.[project_ref].supabase.co
    const poolerMatch = dbUrl.match(/\/\/[^.]+\.([a-z]{20})[.:@]/);
    const directMatch = dbUrl.match(/db\.([a-z]{20})\.supabase/);
    const ref = poolerMatch?.[1] ?? directMatch?.[1];
    if (ref) return `https://${ref}.supabase.co`;
    return "";
  })();

// The anon key is Supabase's "publishable" key — designed for client-side use,
// with security coming from RLS + SECURITY DEFINER — but we still require it
// via env instead of a hardcoded fallback, because a hardcoded value pins a
// specific project's identity into the repo and turns any fork into a client
// of that project.
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

async function rpc<T>(fnName: string, params: Record<string, unknown>): Promise<T> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      "Supabase is not configured: set SUPABASE_URL (or DATABASE_URL) and SUPABASE_ANON_KEY in the deployment environment.",
    );
  }
  const url = `${SUPABASE_URL}/rest/v1/rpc/${fnName}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`supabase-rest rpc/${fnName} ${res.status}: ${text}`);
  }

  // Void RPCs return an empty body — res.json() would throw "Unexpected end
  // of JSON input" (this crashed journal saves after the entry was created).
  const text = await res.text();
  if (!text) return null as T;
  return JSON.parse(text) as T;
}

export interface DbUser {
  id: string;
  email: string;
  emailVerified: boolean;
  passwordHash: string | null;
  name: string;
  avatarUrl: string | null;
  role: string;
  status: string;
  authProvider: string;
  googleId: string | null;
  appleId: string | null;
  twoFactorEnabled: boolean;
  twoFactorSecret: string | null;
  fontSize: string;
  themePreference: string;
  language: string;
  createdAt: string;
  updatedAt: string;
  points: number;
}

export interface DbRefreshToken {
  id: string;
  userId: string;
  tokenHash: string;
  family: string;
  createdAt: string;
  expiresAt: string;
  revokedAt: string | null;
  replacedBy: string | null;
}

export const db = {
  user: {
    async findByEmail(email: string): Promise<DbUser | null> {
      return rpc<DbUser | null>("auth_find_user_by_email", { p_email: email });
    },

    async findById(id: string): Promise<DbUser | null> {
      return rpc<DbUser | null>("auth_find_user_by_id", { p_id: id });
    },

    async create(params: {
      id: string;
      email: string;
      name: string;
      passwordHash?: string | null;
      authProvider?: string;
      role?: string;
      status?: string;
    }): Promise<DbUser> {
      return rpc<DbUser>("auth_create_user", {
        p_id: params.id,
        p_email: params.email,
        p_name: params.name,
        p_password_hash: params.passwordHash ?? null,
        p_auth_provider: params.authProvider ?? "email",
        p_role: params.role ?? "user",
        p_status: params.status ?? "active",
      });
    },

    async update(id: string, data: Record<string, unknown>): Promise<DbUser | null> {
      return rpc<DbUser | null>("auth_update_user", { p_id: id, p_data: data });
    },
  },

  refreshToken: {
    async create(params: {
      userId: string;
      tokenHash: string;
      family: string;
      expiresAt: Date;
    }): Promise<DbRefreshToken> {
      return rpc<DbRefreshToken>("auth_create_refresh_token", {
        p_user_id: params.userId,
        p_token_hash: params.tokenHash,
        p_family: params.family,
        p_expires_at: params.expiresAt.toISOString(),
      });
    },

    async findByHash(tokenHash: string): Promise<DbRefreshToken | null> {
      return rpc<DbRefreshToken | null>("auth_find_refresh_token", {
        p_token_hash: tokenHash,
      });
    },

    async rotate(params: {
      oldId: string;
      replacedBy: string;
      userId: string;
      newTokenHash: string;
      family: string;
      expiresAt: Date;
    }): Promise<DbRefreshToken> {
      return rpc<DbRefreshToken>("auth_rotate_refresh_token", {
        p_old_id: params.oldId,
        p_replaced_by: params.replacedBy,
        p_user_id: params.userId,
        p_new_token_hash: params.newTokenHash,
        p_family: params.family,
        p_expires_at: params.expiresAt.toISOString(),
      });
    },

    async revokeFamily(family: string): Promise<void> {
      await rpc<null>("auth_revoke_token_family", { p_family: family });
    },

    async revoke(tokenHash: string): Promise<void> {
      await rpc<null>("auth_revoke_refresh_token", { p_token_hash: tokenHash });
    },
  },

  loginEvent: {
    async create(params: {
      userId: string;
      ipAddress?: string | null;
      userAgent?: string;
      success: boolean;
      reason?: string;
    }): Promise<void> {
      await rpc<null>("auth_create_login_event", {
        p_user_id: params.userId,
        p_ip_address: params.ipAddress ?? null,
        p_user_agent: params.userAgent ?? null,
        p_success: params.success,
        p_reason: params.reason ?? null,
      });
    },
  },

  passwordResetToken: {
    async create(params: { userId: string; tokenHash: string; expiresAt: Date }): Promise<void> {
      await rpc<null>("auth_create_password_reset_token", {
        p_user_id: params.userId,
        p_token_hash: params.tokenHash,
        p_expires_at: params.expiresAt.toISOString(),
      });
    },
  },

  session: {
    async revokeOtherSessions(userId: string, currentTokenHash?: string | null): Promise<void> {
      await rpc<null>("auth_revoke_other_sessions", {
        p_user_id: userId,
        p_current_token_hash: currentTokenHash ?? null,
      });
    },
  },

  audit: {
    async create(params: {
      userId?: string | null;
      action: string;
      targetType?: string;
      targetId?: string;
      metadata?: string | null;
      ipAddress?: string;
    }): Promise<void> {
      await rpc<null>("auth_create_audit_log", {
        p_user_id: params.userId ?? null,
        p_action: params.action,
        p_target_type: params.targetType ?? null,
        p_target_id: params.targetId ?? null,
        p_metadata: params.metadata ?? null,
        p_ip_address: params.ipAddress ?? null,
      });
    },
  },
};
