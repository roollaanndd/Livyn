import { NextResponse } from "next/server";
import { getAvailableVersions } from "@/lib/bible/api-bible";

export async function GET() {
  if (!process.env.API_BIBLE_KEY) {
    return NextResponse.json({
      versions: [{ id: "", abbreviation: "TB", name: "Terjemahan Baru", nameLocal: "Terjemahan Baru", description: "Versi bawaan (terbatas)" }],
      configured: false,
    });
  }

  const versions = await getAvailableVersions();

  if (versions.length === 0) {
    return NextResponse.json({
      versions: [{ id: "", abbreviation: "TB", name: "Terjemahan Baru", nameLocal: "Terjemahan Baru", description: "Versi bawaan (terbatas)" }],
      configured: true,
    });
  }

  return NextResponse.json({ versions, configured: true });
}
