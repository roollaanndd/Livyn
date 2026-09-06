import { ImageResponse } from "next/og";
import { SITE_DESCRIPTION, SITE_TAGLINE } from "@/lib/site";

/**
 * The card people actually see when a Livyn link is pasted into WhatsApp,
 * X or a group chat — until now there was none, so every share rendered as a
 * bare domain and a line of grey text.
 *
 * Drawn rather than shipped as a file so it stays in step with the brand: the
 * same night-green ground, the same gold, and the mark redrawn as flat paths
 * (ImageResponse has no gradient support worth relying on at this size, and a
 * remote font fetch at request time is one more thing that can fail — the
 * built-in font is enough for four lines of text).
 */
export const alt = "Livyn — Faith. Every Day. Every Step.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#0a1610",
          backgroundImage:
            "radial-gradient(900px 520px at 78% -10%, rgba(200,155,60,0.28), transparent 65%), radial-gradient(700px 500px at 5% 110%, rgba(76,175,125,0.16), transparent 65%)",
          color: "#edf3ef",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="56" height="56" viewBox="0 0 120 120" fill="none">
            <path
              d="M40 12C40 9.8 41.8 8 44 8H56C58.2 8 60 9.8 60 12V78C60 88 68 96 78 96C80.2 96 82 97.8 82 100V108C82 110.2 80.2 112 78 112C56 112 40 96 40 74V12Z"
              fill="#4CAF7D"
            />
            <path
              d="M60 88C64 96 71 103 80 107C82 108 82.5 110.5 81 112.2C79.5 113.8 77 114 75 113C63 107 53 97 48 84C47 81.5 48.5 79 51 78.5L58 77C60 76.5 61.5 78 60 88Z"
              fill="#C89B3C"
              opacity="0.75"
            />
          </svg>
          <span style={{ fontSize: 40, fontWeight: 800, letterSpacing: "0.06em" }}>LIVYN</span>
          <span
            style={{
              marginLeft: 12,
              fontSize: 20,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#c89b3c",
            }}
          >
            {SITE_TAGLINE}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          {/* Satori needs an explicit display on any element with more than one
              child, and it has no <br>: the headline is two flex rows. */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 78,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
            }}
          >
            <span>Iman yang ditemani,</span>
            <span style={{ color: "#e2bd6a" }}>setiap hari.</span>
          </div>
          <div style={{ fontSize: 28, lineHeight: 1.45, color: "#93a79c", maxWidth: 860 }}>
            {SITE_DESCRIPTION}
          </div>
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          {["Renungan harian", "Alkitab", "Pengingat doa", "AI Pastor", "Circle"].map((chip) => (
            <span
              key={chip}
              style={{
                fontSize: 22,
                color: "#93a79c",
                border: "1px solid rgba(200,155,60,0.3)",
                borderRadius: 999,
                padding: "10px 22px",
              }}
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
