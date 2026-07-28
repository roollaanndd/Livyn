import { getLocale } from "@/lib/i18n/server";
import { getPrivacyDocument } from "@/lib/terms/content";
import { TERMS_EFFECTIVE_DATE } from "@/lib/terms/config";
import { PolicyPage } from "@/components/terms/policy-page";

export async function generateMetadata() {
  const locale = await getLocale();
  return { title: `${getPrivacyDocument(locale).title} — Livyn` };
}

export default async function PrivacyPage() {
  const locale = await getLocale();
  return (
    <PolicyPage
      doc={getPrivacyDocument(locale)}
      locale={locale}
      effectiveDate={TERMS_EFFECTIVE_DATE}
      backHref="/app/profil"
    />
  );
}
