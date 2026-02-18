import type { Metadata } from "next";

import { ChartsPageClient } from "@/components/pages/charts-page-client";

export const metadata: Metadata = {
  title: "Visualizations | YouTube Success ML",
  description:
    "Advanced visual analytics for global YouTube performance, category dominance, growth dynamics, and data processing transparency.",
  alternates: {
    canonical: "/visualizations/charts",
  },
};

export default function ChartsPage() {
  return <ChartsPageClient />;
}
