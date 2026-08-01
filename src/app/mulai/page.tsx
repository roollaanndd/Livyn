import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { SplashScreen } from "../splash-screen";

/**
 * The app's entrance, unchanged — this is what `/` used to be, moved aside so
 * `/` can be the public landing page. The splash still decides where a visitor
 * actually lands: `/app` when signed in, `/onboarding` on a first visit,
 * `/masuk` otherwise.
 */
export default async function MulaiPage() {
  const session = await getCurrentUser().catch(() => null);
  if (session) redirect("/app");
  return <SplashScreen />;
}
