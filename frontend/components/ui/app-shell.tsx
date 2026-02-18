import Link from "next/link";

import { TopNav } from "@/components/ui/top-nav";

type Action = {
  href: string;
  label: string;
  tone?: "primary" | "secondary";
};

type AppShellProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  actions?: Action[];
  children: React.ReactNode;
};

export function AppShell({ eyebrow, title, subtitle, actions = [], children }: AppShellProps) {
  return (
    <div className="pageShell">
      <div className="pageFrame">
        <TopNav />

        <section className="heroPanel">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="heroSubtitle">{subtitle}</p>
          {actions.length > 0 && (
            <div className="heroActions">
              {actions.map((action) => (
                <Link
                  key={`${action.href}-${action.label}`}
                  href={action.href}
                  className={action.tone === "secondary" ? "pillLink secondary" : "pillLink"}
                >
                  {action.label}
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="contentStack">{children}</section>
      </div>
    </div>
  );
}
