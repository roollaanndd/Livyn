-- Close Supabase's auto-generated REST API to the public roles.
--
-- Livyn reaches PostgREST as the service role and authorizes in the app
-- (src/proxy.ts + an RBAC check in every route handler). It runs its own JWT
-- auth via `jose`, not Supabase Auth, so auth.uid() is always NULL inside
-- Postgres and RLS cannot express a per-user rule for us -- which is why the
-- pre-existing policies had to be permissive to `anon` to let the app work.
--
-- The consequence was that the publishable `anon` key -- the one designed to
-- be handed to browsers -- was a master key: every table readable and
-- writable, and every auth_* SECURITY DEFINER function callable, including
-- auth_find_user_by_email, which returns passwordHash and twoFactorSecret for
-- any address given.
--
-- service_role holds BYPASSRLS and keeps its grants, so the application is
-- unaffected by anything below.
--
-- Every statement is idempotent; re-running is a no-op.

-- 1. RLS on for the tables that never had it, so the REST surface is
--    deny-by-default even if a grant is later restored by accident.
ALTER TABLE public."Circle"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CircleMember"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."CircleBroadcast"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PrayerRequest"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PrayerIntercession"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."WeeklyMission"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."MissionCheckIn"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Friendship"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."FriendInviteCode"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."LeaderProfile"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."VersePing"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PersonalPrayer"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."FavoriteVerse"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."DailyActivity"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ReadingPlan"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ReadingPlanEnrollment" ENABLE ROW LEVEL SECURITY;

-- 2. Take every privilege away from the two public-facing roles.
REVOKE ALL PRIVILEGES ON ALL TABLES    IN SCHEMA public FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;

-- 3. Stop future objects from being granted to them again by default.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES    FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES    FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated;
