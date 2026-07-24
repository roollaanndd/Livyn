import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { SplashScreen } from "./splash-screen";

export default async function RootPage() {
  const session = await getCurrentUser().catch(() => null);
  if (session) redirect("/app");
  return <SplashScreen />;
}
