import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { LOCALE_COOKIE, isLocale } from "@/lib/i18n/config";

const ONE_YEAR = 60 * 60 * 24 * 365;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const locale = (body as { locale?: unknown } | null)?.locale;
  if (!isLocale(locale)) {
    return NextResponse.json({ error: "Bahasa tidak dikenal" }, { status: 400 });
  }

  const res = NextResponse.json({ locale });
  // Not httpOnly: the cookie is only a UI preference and the switcher reads it.
  res.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
  });

  // Signed-out visitors still get the cookie; only members get it persisted.
  const session = await getCurrentUser();
  if (session) {
    await prisma.user
      .update({ where: { id: session.sub }, data: { language: locale } })
      .catch(() => null);
  }

  return res;
}
