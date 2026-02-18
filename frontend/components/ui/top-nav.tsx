"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const items = [
  { href: "/", label: "Overview" },
  { href: "/visualizations/charts", label: "Visualizations" },
  { href: "/intelligence/lab", label: "Intelligence Lab" },
  { href: "/wiki", label: "Wiki" },
];

export function TopNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="topbar">
      <div className="topbarBrand">
        <span className="brandDot" />
        <div>
          <strong>YouTube Success ML</strong>
          <p>Production Intelligence Suite</p>
        </div>
      </div>

      <button
        type="button"
        className="topbarToggle"
        aria-expanded={open}
        aria-controls="topbar-nav"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Close" : "Menu"}
      </button>

      <nav id="topbar-nav" className={open ? "topbarNav open" : "topbarNav"} aria-label="Primary">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? "navLink active" : "navLink"}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
