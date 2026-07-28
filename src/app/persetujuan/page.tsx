import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { hasAcceptedCurrentTerms } from "@/lib/terms/guard";
import { getLocale, getT } from "@/lib/i18n/server";
import { CONSENT_SUMMARY } from "@/lib/terms/content";
import { I18nProvider } from "@/lib/i18n/client";
import { ConsentForm } from "@/components/terms/consent-form";

export async function generateMetadata() {
  const t = await getT();
  return { title: `${t("terms.heading")} — Livyn` };
}

export default async function ConsentPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/");
  // Someone who already agreed has no business on this screen — and without
  // this check, accepting would bounce them straight back here.
  if (await hasAcceptedCurrentTerms(session.sub)) redirect("/app");

  const locale = await getLocale();

  return (
    <I18nProvider locale={locale}>
      <ConsentForm points={CONSENT_SUMMARY[locale] ?? CONSENT_SUMMARY.id} />
    </I18nProvider>
  );
}
