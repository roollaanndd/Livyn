import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { TERMS_VERSION } from "./config";

/** True when this user has accepted the version of the terms currently in force. */
export const hasAcceptedCurrentTerms = cache(async (userId: string): Promise<boolean> => {
  const user = await prisma.user
    .findUnique({ where: { id: userId }, select: { termsAcceptedAt: true, termsVersion: true } })
    .catch(() => null);
  // A database hiccup must not lock members out of an app they already agreed
  // to; failing open here only risks showing the consent screen one time late.
  if (!user) return true;
  return Boolean(user.termsAcceptedAt) && user.termsVersion === TERMS_VERSION;
});

/** Redirects to the consent screen unless the signed-in member has accepted. */
export async function requireAcceptedTerms() {
  const session = await getCurrentUser();
  if (!session) return;
  if (await hasAcceptedCurrentTerms(session.sub)) return;
  redirect("/persetujuan");
}
