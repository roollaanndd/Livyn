import { redirect } from "next/navigation";

// Legacy per-devotion route. The devotion feature is now one-per-day only,
// so any old slug link redirects to today's devotion.
export default function LegacyDevotionSlugPage() {
  redirect("/app/devosi");
}
