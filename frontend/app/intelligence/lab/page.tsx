import type { Metadata } from "next";

import { IntelligenceLabClient } from "@/components/pages/intelligence-lab-client";

export const metadata: Metadata = {
  title: "Intelligence Lab | YouTube Success ML",
  description:
    "Run scenario simulations, batch inference, drift checks, and model explainability workflows for YouTube growth strategy.",
  alternates: {
    canonical: "/intelligence/lab",
  },
};

export default function IntelligenceLabPage() {
  return <IntelligenceLabClient />;
}
