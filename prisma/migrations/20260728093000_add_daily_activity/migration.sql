-- CreateTable
CREATE TABLE IF NOT EXISTS "DailyActivity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "DailyActivity_userId_day_kind_key"
    ON "DailyActivity"("userId", "day", "kind");
CREATE INDEX IF NOT EXISTS "DailyActivity_userId_day_idx"
    ON "DailyActivity"("userId", "day");

-- AddForeignKey
ALTER TABLE "DailyActivity" DROP CONSTRAINT IF EXISTS "DailyActivity_userId_fkey";
ALTER TABLE "DailyActivity" ADD CONSTRAINT "DailyActivity_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DailyActivity" DISABLE ROW LEVEL SECURITY;
