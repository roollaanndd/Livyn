-- Finish what 20260819180000 started: make the whole public schema uniformly
-- RLS-on with zero policies, i.e. deny-all for every role that does not hold
-- BYPASSRLS.
--
-- After that migration, `anon` and `authenticated` hold no privileges on any
-- table, so the 166 permissive policies left on the 27 originally-RLS-enabled
-- tables were already unreachable. They were still a trap: a single
-- `GRANT ... TO anon` -- from a tutorial, a Supabase dashboard click, a future
-- contributor -- would have re-opened those 27 tables wide, while the 16
-- tables locked in the previous migration stayed shut. Removing them means the
-- grant alone can never be enough.
--
-- Every policy in this schema targeted {anon}, {authenticated} or both; none
-- targeted service_role or postgres, and RLS never applies to service_role in
-- the first place. So nothing here can affect the application.
--
-- Both loops are idempotent; re-running is a no-op.

-- 1. RLS on for every table in the schema, including any added since.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.relname);
  END LOOP;
END $$;

-- 2. Drop every policy. RLS enabled with no policy = deny-all.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;
