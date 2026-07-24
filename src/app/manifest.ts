import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Livyn — Faith. Every Day. Every Step.",
    short_name: "Livyn",
    description:
      "Renungan harian, Alkitab, AI Pastor, pengingat doa, dan khotbah dalam satu aplikasi.",
    start_url: "/app",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0D1512",
    theme_color: "#2D7D5F",
    categories: ["lifestyle", "education"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [],
  };
}
