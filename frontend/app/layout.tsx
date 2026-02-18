import type { Metadata, Viewport } from "next";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://hoangsonww.github.io/YouTube-Success-Prediction-ML"),
  manifest: "/manifest.json",
  title: {
    default: "YouTube Success Prediction ML",
    template: "%s",
  },
  description:
    "Production-grade YouTube intelligence platform for channel outcome prediction, clustering, explainability, and global analytics.",
  applicationName: "YouTube Success Prediction ML",
  keywords: [
    "YouTube analytics",
    "machine learning",
    "subscriber prediction",
    "channel clustering",
    "MLOps",
    "growth forecasting",
  ],
  authors: [{ name: "Son Nguyen" }],
  creator: "Son Nguyen",
  publisher: "YouTube Success Prediction ML",
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
    title: "YouTube Success Prediction ML",
    description:
      "Predict subscribers, earnings, and growth. Explore clustering archetypes and global YouTube intelligence.",
    siteName: "YouTube Success Prediction ML",
    images: [
      {
        url: "/android-chrome-512x512.png",
        width: 512,
        height: 512,
        alt: "YouTube Success Prediction ML",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "YouTube Success Prediction ML",
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
