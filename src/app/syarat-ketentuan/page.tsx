import { getLocale } from "@/lib/i18n/server";
import { getTermsDocument } from "@/lib/terms/content";
import { TERMS_EFFECTIVE_DATE } from "@/lib/terms/config";
import { PolicyPage } from "@/components/terms/policy-page";

export async function generateMetadata() {
  const locale = await getLocale();
  return { title: `${getTermsDocument(locale).title} — Livyn` };
}

export default async function TermsPage() {
  const locale = await getLocale();
  return (
    <PolicyPage
      doc={getTermsDocument(locale)}
      locale={locale}
      effectiveDate={TERMS_EFFECTIVE_DATE}
      backHref="/app/profil"
    />
  );
}
