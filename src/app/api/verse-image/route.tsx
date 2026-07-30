import { ImageResponse } from "next/og";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "edge";

// A rendered verse card is a picture of whatever text the caller passed, served
// from this app's own domain and carrying its logo. Left open it is both free
// rendering compute and a way to dress arbitrary words up as something Livyn
// published, so it is gated exactly like /api/verse-image/generate.
const MAX_TEXT_LENGTH = 600;
const MAX_REF_LENGTH = 80;

export async function GET(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
  }

  const limited = rateLimit(`verse-img-render:${session.sub}`, 60, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Terlalu banyak permintaan. Coba lagi nanti." }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const text = searchParams.get("text");
  const ref = searchParams.get("ref");
  const theme = searchParams.get("theme") ?? "mountain";

  if (!text || !ref) {
    return NextResponse.json({ error: "text and ref are required" }, { status: 400 });
  }

  if (text.length > MAX_TEXT_LENGTH || ref.length > MAX_REF_LENGTH) {
    return NextResponse.json(
      { error: `Teks maksimal ${MAX_TEXT_LENGTH} karakter dan referensi maksimal ${MAX_REF_LENGTH} karakter.` },
      { status: 400 },
    );
  }

  const themes: Record<
    string,
    {
      sky: string;
      mountain1: string;
      mountain2: string;
      mountain3: string;
      ground: string;
      sun: string;
      sunGlow: string;
      cloud: string;
      textColor: string;
      refColor: string;
      tagColor: string;
      overlay: string;
    }
  > = {
    mountain: {
      sky: "linear-gradient(180deg, #1a1a3e 0%, #2d1b4e 25%, #e8896b 55%, #f4a261 75%, #f7c59f 100%)",
      mountain1: "#1a1a3e",
      mountain2: "#2a1f4a",
      mountain3: "#3d2b5a",
      ground: "#1a1a3e",
      sun: "#f4a261",
      sunGlow: "rgba(244, 162, 97, 0.4)",
      cloud: "rgba(255,255,255,0.08)",
      textColor: "rgba(255,255,255,0.95)",
      refColor: "#f4a261",
      tagColor: "rgba(255,255,255,0.35)",
      overlay: "rgba(26, 26, 62, 0.45)",
    },
    lake: {
      sky: "linear-gradient(180deg, #0a1628 0%, #1a3a5c 30%, #3a7ca5 55%, #7ec8e3 75%, #b8e4f0 100%)",
      mountain1: "#0a1628",
      mountain2: "#142d4a",
      mountain3: "#1e4060",
      ground: "#0a1628",
      sun: "#e8d5b7",
      sunGlow: "rgba(232, 213, 183, 0.3)",
      cloud: "rgba(255,255,255,0.1)",
      textColor: "rgba(255,255,255,0.95)",
      refColor: "#7ec8e3",
      tagColor: "rgba(255,255,255,0.35)",
      overlay: "rgba(10, 22, 40, 0.4)",
    },
    forest: {
      sky: "linear-gradient(180deg, #0d1b0e 0%, #1a3a1e 30%, #2d5a2e 55%, #4a8a4b 75%, #8bc28d 100%)",
      mountain1: "#0d1b0e",
      mountain2: "#1a3a1e",
      mountain3: "#254a28",
      ground: "#0d1b0e",
      sun: "#d4e8a0",
      sunGlow: "rgba(212, 232, 160, 0.25)",
      cloud: "rgba(255,255,255,0.06)",
      textColor: "rgba(255,255,255,0.95)",
      refColor: "#8bc28d",
      tagColor: "rgba(255,255,255,0.35)",
      overlay: "rgba(13, 27, 14, 0.45)",
    },
    sunset: {
      sky: "linear-gradient(180deg, #1a0a2e 0%, #4a1942 25%, #c0392b 50%, #e67e22 70%, #f1c40f 90%, #f9e547 100%)",
      mountain1: "#1a0a2e",
      mountain2: "#2e1535",
      mountain3: "#4a1942",
      ground: "#1a0a2e",
      sun: "#f1c40f",
      sunGlow: "rgba(241, 196, 15, 0.5)",
      cloud: "rgba(255,255,255,0.07)",
      textColor: "rgba(255,255,255,0.95)",
      refColor: "#f1c40f",
      tagColor: "rgba(255,255,255,0.35)",
      overlay: "rgba(26, 10, 46, 0.4)",
    },
  };

  const t = themes[theme] ?? themes.mountain;
  const fontSize = text.length > 150 ? 26 : text.length > 80 ? 30 : 36;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
          background: t.sky,
        }}
      >
        {/* Sun / moon circle */}
        <div
          style={{
            position: "absolute",
            top: "180px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            background: t.sun,
            display: "flex",
          }}
        />
        {/* Sun glow */}
        <div
          style={{
            position: "absolute",
            top: "140px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "200px",
            height: "200px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${t.sunGlow} 0%, transparent 70%)`,
            display: "flex",
          }}
        />

        {/* Clouds */}
        <div
          style={{
            position: "absolute",
            top: "80px",
            left: "60px",
            width: "140px",
            height: "40px",
            borderRadius: "20px",
            background: t.cloud,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "110px",
            right: "80px",
            width: "100px",
            height: "30px",
            borderRadius: "15px",
            background: t.cloud,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "60px",
            right: "200px",
            width: "80px",
            height: "25px",
            borderRadius: "12px",
            background: t.cloud,
            display: "flex",
          }}
        />

        {/* Far mountains */}
        <svg
          width="640"
          height="300"
          viewBox="0 0 640 300"
          style={{ position: "absolute", bottom: "0", left: "0" }}
        >
          <polygon
            points="0,300 80,120 160,180 240,80 320,160 400,60 480,140 560,100 640,180 640,300"
            fill={t.mountain3}
            opacity="0.7"
          />
          <polygon
            points="0,300 40,160 120,200 200,130 300,190 380,100 460,170 540,120 620,160 640,200 640,300"
            fill={t.mountain2}
            opacity="0.85"
          />
          <polygon
            points="0,240 60,200 140,230 220,180 320,220 400,170 500,210 580,180 640,220 640,300 0,300"
            fill={t.mountain1}
          />
        </svg>

        {/* Pine tree silhouettes left */}
        <svg
          width="100"
          height="160"
          viewBox="0 0 100 160"
          style={{ position: "absolute", bottom: "20px", left: "15px" }}
        >
          <polygon points="25,0 0,80 50,80" fill={t.mountain1} />
          <polygon points="25,30 5,90 45,90" fill={t.mountain1} />
          <rect x="22" y="80" width="6" height="80" fill={t.mountain1} />
          <polygon points="75,20 50,100 100,100" fill={t.mountain2} />
          <polygon points="75,50 55,110 95,110" fill={t.mountain2} />
          <rect x="72" y="100" width="6" height="60" fill={t.mountain2} />
        </svg>

        {/* Pine tree silhouettes right */}
        <svg
          width="90"
          height="140"
          viewBox="0 0 90 140"
          style={{ position: "absolute", bottom: "20px", right: "20px" }}
        >
          <polygon points="45,0 15,80 75,80" fill={t.mountain1} />
          <polygon points="45,30 20,90 70,90" fill={t.mountain1} />
          <rect x="42" y="80" width="6" height="60" fill={t.mountain1} />
          <polygon points="15,40 0,100 30,100" fill={t.mountain2} />
          <rect x="12" y="95" width="6" height="45" fill={t.mountain2} />
        </svg>

        {/* Ground / foreground hill */}
        <div
          style={{
            position: "absolute",
            bottom: "0",
            left: "0",
            right: "0",
            height: "60px",
            background: t.ground,
            display: "flex",
          }}
        />

        {/* Stars (small dots) */}
        <div style={{ position: "absolute", top: "30px", left: "100px", width: "3px", height: "3px", borderRadius: "50%", background: "rgba(255,255,255,0.5)", display: "flex" }} />
        <div style={{ position: "absolute", top: "50px", left: "250px", width: "2px", height: "2px", borderRadius: "50%", background: "rgba(255,255,255,0.4)", display: "flex" }} />
        <div style={{ position: "absolute", top: "20px", left: "400px", width: "3px", height: "3px", borderRadius: "50%", background: "rgba(255,255,255,0.6)", display: "flex" }} />
        <div style={{ position: "absolute", top: "45px", left: "520px", width: "2px", height: "2px", borderRadius: "50%", background: "rgba(255,255,255,0.35)", display: "flex" }} />
        <div style={{ position: "absolute", top: "15px", right: "150px", width: "2px", height: "2px", borderRadius: "50%", background: "rgba(255,255,255,0.45)", display: "flex" }} />
        <div style={{ position: "absolute", top: "70px", left: "450px", width: "2px", height: "2px", borderRadius: "50%", background: "rgba(255,255,255,0.3)", display: "flex" }} />

        {/* Content overlay */}
        <div
          style={{
            position: "absolute",
            inset: "0",
            background: t.overlay,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px 50px",
          }}
        >
          {/* Livyn Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "32px",
            }}
          >
            <svg width="32" height="32" viewBox="0 0 120 120" fill="none">
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
                fontSize: "16px",
                fontWeight: 800,
                letterSpacing: "0.08em",
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
              opacity: 0.6,
              marginBottom: "24px",
              borderRadius: "1px",
              display: "flex",
            }}
          />

          {/* Quote mark */}
          <div
            style={{
              fontSize: "64px",
              lineHeight: "0.5",
              color: t.refColor,
              opacity: 0.4,
              marginBottom: "14px",
              fontFamily: "Georgia, serif",
              display: "flex",
            }}
          >
            {"“"}
          </div>

          {/* Verse text */}
          <div
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: 1.6,
              color: t.textColor,
              textAlign: "center",
              maxWidth: "500px",
              fontFamily: "Georgia, serif",
              fontStyle: "italic",
              display: "flex",
              textShadow: "0 2px 8px rgba(0,0,0,0.4)",
            }}
          >
            {text}
          </div>

          {/* Closing quote */}
          <div
            style={{
              fontSize: "64px",
              lineHeight: "0.5",
              color: t.refColor,
              opacity: 0.4,
              marginTop: "14px",
              fontFamily: "Georgia, serif",
              display: "flex",
            }}
          >
            {"”"}
          </div>

          {/* Reference */}
          <div
            style={{
              fontSize: "17px",
              fontWeight: 700,
              color: t.refColor,
              marginTop: "24px",
              letterSpacing: "0.02em",
              display: "flex",
              textShadow: "0 1px 4px rgba(0,0,0,0.3)",
            }}
          >
            {ref}
          </div>

          {/* Bottom watermark */}
          <div
            style={{
              position: "absolute",
              bottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span
              style={{
                fontSize: "10px",
                color: t.tagColor,
                letterSpacing: "0.2em",
              }}
            >
              FAITH · EVERY DAY · EVERY STEP
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 640,
      height: 640,
    },
  );
}
