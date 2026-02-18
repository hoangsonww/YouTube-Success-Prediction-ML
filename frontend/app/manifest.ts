import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "YouTube Success Prediction ML",
    short_name: "YT Success ML",
    description: "Production-grade YouTube intelligence platform.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f1d3d",
    theme_color: "#0f1d3d",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
