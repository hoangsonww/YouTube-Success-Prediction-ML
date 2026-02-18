import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://youtube-success-ml.example.com"),
  title: {
    default: "YouTube Success ML",
    template: "%s",
  },
  description:
    "Production-grade YouTube intelligence platform for channel outcome prediction, clustering, explainability, and global analytics.",
  applicationName: "YouTube Success ML",
  keywords: [
    "YouTube analytics",
    "machine learning",
    "subscriber prediction",
    "channel clustering",
    "MLOps",
    "growth forecasting",
  ],
  authors: [{ name: "YouTube Success ML Team" }],
  creator: "YouTube Success ML Team",
  publisher: "YouTube Success ML",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "YouTube Success ML",
    description:
      "Predict subscribers, earnings, and growth. Explore clustering archetypes and global YouTube intelligence.",
    siteName: "YouTube Success ML",
    images: [
      { url: "/android-chrome-512x512.png", width: 512, height: 512, alt: "YouTube Success ML" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "YouTube Success ML",
    description:
      "Production intelligence dashboard for YouTube success prediction, clustering, and advanced analytics.",
    images: ["/android-chrome-512x512.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0f1d3d",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
