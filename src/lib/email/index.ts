import "server-only";
import { optional } from "@/lib/env";

/**
 * Minimal outbound email adapter. Two backends today:
 *
 *   - Resend, when RESEND_API_KEY is set (production and previews).
 *   - console.log, when it isn't and NODE_ENV !== "production" (local dev).
 *
 * In production without RESEND_API_KEY the adapter throws, because the
 * previous behaviour — `console.log("[Livyn] reset link ...")` — meant
 * password reset "worked" from the app's perspective but silently dropped
 * the email, leaving users with no way to recover their account.
 *
 * The From/reply-to address comes from EMAIL_FROM (e.g.
 * `"Livyn <noreply@yourdomain.id>"`). Resend requires the domain to be
 * verified before it will deliver from it.
 */

export type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export async function sendEmail(args: SendEmailArgs): Promise<void> {
  const apiKey = optional("RESEND_API_KEY");
  const from = optional("EMAIL_FROM") ?? "Livyn <noreply@livyn.app>";
  const isProd = process.env.NODE_ENV === "production";

  if (!apiKey) {
    if (isProd) {
      throw new Error(
        "Email is not configured: set RESEND_API_KEY (and verify the sending domain in Resend). Falling back to console logging would silently drop password-reset and verification mails.",
      );
    }
    // Dev fallback so the local server keeps working. Deliberately verbose
    // so it's obvious what would have been sent.
    console.log(
      `[Livyn:email] would send to=${args.to} subject=${JSON.stringify(args.subject)}\n${args.text ?? args.html}`,
    );
    return;
  }

  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [args.to],
      subject: args.subject,
      html: args.html,
      text: args.text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend send failed: ${res.status} ${body}`);
  }
}
