import { ImageResponse } from "next/og";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get("text");
  const ref = searchParams.get("ref");
  const theme = searchParams.get("theme") ?? "forest";

  if (!text || !ref) {
    return NextResponse.json({ error: "text and ref are required" }, { status: 400 });
  }

  const themes: Record<string, { bg: string; orb1: string; orb2: string; textColor: string; refColor: string; tagColor: string }> = {
    forest: {
      bg: "linear-gradient(145deg, #0A1610 0%, #0F1D17 35%, #152820 65%, #0D1512 100%)",
      orb1: "rgba(76, 175, 125, 0.25)",
      orb2: "rgba(200, 155, 60, 0.15)",
      textColor: "rgba(255,255,255,0.92)",
      refColor: "#4CAF7D",
      tagColor: "rgba(255,255,255,0.3)",
    },
    golden: {
      bg: "linear-gradient(145deg, #1A1408 0%, #2A1F0E 35%, #1E180A 65%, #151008 100%)",
      orb1: "rgba(200, 155, 60, 0.3)",
      orb2: "rgba(76, 175, 125, 0.15)",
      textColor: "rgba(255,255,255,0.92)",
      refColor: "#C89B3C",
      tagColor: "rgba(255,255,255,0.3)",
    },
    dawn: {
      bg: "linear-gradient(145deg, #1A0E1E 0%, #1E1428 35%, #141020 65%, #0E0A14 100%)",
      orb1: "rgba(160, 120, 200, 0.25)",
      orb2: "rgba(200, 155, 60, 0.15)",
      textColor: "rgba(255,255,255,0.92)",
      refColor: "#B894D8",
      tagColor: "rgba(255,255,255,0.3)",
    },
    ocean: {
      bg: "linear-gradient(145deg, #081418 0%, #0C1E24 35%, #102830 65%, #081418 100%)",
      orb1: "rgba(80, 160, 200, 0.25)",
      orb2: "rgba(76, 175, 125, 0.15)",
      textColor: "rgba(255,255,255,0.92)",
      refColor: "#5CB8D6",
      tagColor: "rgba(255,255,255,0.3)",
    },
  };

  const t = themes[theme] ?? themes.forest;

  const fontSize = text.length > 150 ? 28 : text.length > 80 ? 32 : 38;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: t.bg,
          padding: "60px 50px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Ambient orbs */}
        <div
          style={{
            position: "absolute",
            top: "-60px",
            left: "-60px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${t.orb1} 0%, transparent 70%)`,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-80px",
            right: "-40px",
            width: "350px",
            height: "350px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${t.orb2} 0%, transparent 70%)`,
          }}
        />

        {/* Livyn Logo Mark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "40px",
          }}
        >
          <svg width="36" height="36" viewBox="0 0 120 120" fill="none">
            <path
              d="M40 12C40 9.8 41.8 8 44 8H56C58.2 8 60 9.8 60 12V78C60 88 68 96 78 96C80.2 96 82 97.8 82 100V108C82 110.2 80.2 112 78 112C56 112 40 96 40 74V12Z"
              fill="#4CAF7D"
            />
            <path
              d="M60 88C64 96 71 103 80 107C82 108 82.5 110.5 81 112.2C79.5 113.8 77 114 75 113C63 107 53 97 48 84C47 81.5 48.5 79 51 78.5L58 77C60 76.5 61.5 78 60 88Z"
              fill="#C89B3C"
              opacity="0.65"
            />
          </svg>
          <span
            style={{
              fontSize: "18px",
              fontWeight: 800,
              letterSpacing: "0.05em",
              color: t.tagColor,
            }}
          >
            LIVYN
          </span>
        </div>

        {/* Decorative line */}
        <div
          style={{
            width: "40px",
            height: "2px",
            background: t.refColor,
            opacity: 0.5,
            marginBottom: "30px",
            borderRadius: "1px",
          }}
        />

        {/* Quote mark */}
        <div
          style={{
            fontSize: "72px",
            lineHeight: "0.5",
            color: t.refColor,
            opacity: 0.3,
            marginBottom: "16px",
            fontFamily: "Georgia, serif",
          }}
        >
          &ldquo;
        </div>

        {/* Verse text */}
        <div
          style={{
            fontSize: `${fontSize}px`,
            lineHeight: 1.6,
            color: t.textColor,
            textAlign: "center",
            maxWidth: "520px",
            fontFamily: "Georgia, serif",
            fontStyle: "italic",
          }}
        >
          {text}
        </div>

        {/* Closing quote */}
        <div
          style={{
            fontSize: "72px",
            lineHeight: "0.5",
            color: t.refColor,
            opacity: 0.3,
            marginTop: "16px",
            fontFamily: "Georgia, serif",
          }}
        >
          &rdquo;
        </div>

        {/* Reference */}
        <div
          style={{
            fontSize: "18px",
            fontWeight: 700,
            color: t.refColor,
            marginTop: "28px",
            letterSpacing: "0.02em",
          }}
        >
          {ref}
        </div>

        {/* Bottom watermark */}
        <div
          style={{
            position: "absolute",
            bottom: "24px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span
            style={{
              fontSize: "11px",
              color: t.tagColor,
              letterSpacing: "0.2em",
            }}
          >
            FAITH · EVERY DAY · EVERY STEP
          </span>
        </div>
      </div>
    ),
    {
      width: 640,
      height: 640,
    },
  );
}
