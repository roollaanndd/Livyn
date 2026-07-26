import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    // `id` pins the app's identity. It matches the previous implicit default
    // (which browsers derive from start_url) so existing installs upgrade in
    // place instead of being treated as a brand new app.
    id: "/app",
    name: "Livyn — Faith. Every Day. Every Step.",
    short_name: "Livyn",
    description:
      "Renungan harian, Alkitab, AI Pastor, pengingat doa, dan khotbah dalam satu aplikasi.",
    start_url: "/app",
    // Scope covers the whole origin so /masuk, /onboarding and /offline stay
    // inside the installed app instead of kicking out to the browser.
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    background_color: "#0D1512",
    theme_color: "#2D7D5F",
    lang: "id",
    dir: "ltr",
    categories: ["lifestyle", "education"],
    prefer_related_applications: false,
    // Reuse the already-open window when the app is launched again (e.g. from
    // a push notification) rather than stacking duplicate windows.
    launch_handler: { client_mode: "navigate-existing" },
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
  };
}
