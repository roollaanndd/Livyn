-- Legal consent + habit tracking on User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "termsAcceptedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "termsVersion" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "habitHours" TEXT NOT NULL DEFAULT '';

-- Smart reminders
ALTER TABLE "PrayerReminder" ADD COLUMN IF NOT EXISTS "autoAdjust" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE IF NOT EXISTS "FavoriteVerse" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bookCode" TEXT NOT NULL,
    "bookName" TEXT NOT NULL,
    "chapter" INTEGER NOT NULL,
    "verse" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteVerse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PersonalPrayer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "answeredNote" TEXT,
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonalPrayer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "FavoriteVerse_userId_bookCode_chapter_verse_key"
    ON "FavoriteVerse"("userId", "bookCode", "chapter", "verse");
CREATE INDEX IF NOT EXISTS "FavoriteVerse_userId_createdAt_idx"
    ON "FavoriteVerse"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "PersonalPrayer_userId_status_idx"
    ON "PersonalPrayer"("userId", "status");

-- AddForeignKey
ALTER TABLE "FavoriteVerse" DROP CONSTRAINT IF EXISTS "FavoriteVerse_userId_fkey";
ALTER TABLE "FavoriteVerse" ADD CONSTRAINT "FavoriteVerse_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PersonalPrayer" DROP CONSTRAINT IF EXISTS "PersonalPrayer_userId_fkey";
ALTER TABLE "PersonalPrayer" ADD CONSTRAINT "PersonalPrayer_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- The PostgREST adapter authenticates with the anon key, so every table it
-- touches needs RLS disabled (matching how the community tables were added).
ALTER TABLE "FavoriteVerse" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "PersonalPrayer" DISABLE ROW LEVEL SECURITY;
