import { redirect } from "next/navigation";

// Bookmarks feature retired with the one-devotion-per-day redesign.
export default function LegacyBookmarksPage() {
  redirect("/app/devosi");
}
