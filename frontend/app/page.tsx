import type { Metadata } from "next";

import { Dashboard } from "@/components/dashboard";

export const metadata: Metadata = {
  title: "YouTube Success ML | Predict, Cluster, Analyze",
  description:
    "Production-grade dashboard for YouTube channel success prediction, clustering intelligence, and global market analytics.",
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return <Dashboard />;
}
