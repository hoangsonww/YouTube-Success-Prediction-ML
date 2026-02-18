import type { Metadata } from "next";
import Link from "next/link";

import { AppShell } from "@/components/ui/app-shell";

export const metadata: Metadata = {
  title: "YouTube Success Prediction ML | Project Wiki",
  description:
    "Comprehensive project wiki and landing page with architecture charts, MLOps lifecycle, deployment strategy, and operations runbooks.",
  alternates: {
    canonical: "/wiki",
  },
};

export default function WikiPage() {
  return (
    <AppShell
      eyebrow="Repository Intelligence"
      title="Project Wiki"
      subtitle="Full platform landing and wiki embedded inside the application shell for quick architecture and operations access."
      actions={[
        { href: "/wiki/index.html", label: "Open Fullscreen Wiki" },
        {
          href: "https://github.com/davidnguyen/YouTube-Success-ML",
          label: "Open Repository",
          tone: "secondary",
        },
      ]}
    >
      <article className="panel wikiPanel">
        <div className="panelHeader">
          <h2>Embedded Wiki</h2>
          <Link className="chip" href="/wiki/index.html" target="_blank" rel="noopener noreferrer">
            Open In New Tab
          </Link>
        </div>
        <div className="wikiFrameWrap">
          <iframe
            title="YouTube Success Prediction ML Wiki"
            src="/wiki/index.html"
            className="wikiFrame"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>
      </article>
    </AppShell>
  );
}
