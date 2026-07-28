import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { PolicyDocument } from "@/lib/terms/content";
import type { Locale } from "@/lib/i18n/config";

export function PolicyPage({
  doc,
  locale,
  effectiveDate,
  backHref,
}: {
  doc: PolicyDocument;
  locale: Locale;
  effectiveDate: Date;
  backHref: string;
}) {
  const formatted = effectiveDate.toLocaleDateString(locale === "en" ? "en-GB" : "id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="mx-auto min-h-dvh max-w-md px-5 pb-16 safe-top">
      <div className="flex items-center gap-2 py-3">
        <Link
          href={backHref}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-muted text-muted-foreground"
          aria-label={locale === "en" ? "Back" : "Kembali"}
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
      </div>

      <h1 className="font-display text-[24px] font-extrabold leading-tight text-heading">{doc.title}</h1>
      <p className="mt-1 text-[12px] text-muted-foreground">
        {locale === "en" ? `Last updated ${formatted}` : `Terakhir diperbarui ${formatted}`}
      </p>
      <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground">{doc.intro}</p>

      <div className="mt-7 space-y-7">
        {doc.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-display text-[16px] font-extrabold text-heading">{section.heading}</h2>
            <div className="mt-2 space-y-2.5">
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph} className="text-[13.5px] leading-relaxed text-muted-foreground">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
