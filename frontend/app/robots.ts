import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://hoangsonww.github.io/YouTube-Success-Prediction-ML/sitemap.xml",
  };
}
