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
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  function toggleCollapsed() {
    setCollapsed((value) => !value);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        className={collapsed ? "topbarDockToggle collapsed" : "topbarDockToggle"}
        aria-expanded={!collapsed}
        aria-controls="topbar-shell"
        aria-label={collapsed ? "Show navigation bar" : "Hide navigation bar"}
        title={collapsed ? "Show navigation bar" : "Hide navigation bar"}
        onClick={toggleCollapsed}
      >
        <svg
          className="topbarDockIcon"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M5 7H19" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
          <path d="M5 12H19" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
          <path d="M5 17H15" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        </svg>
      </button>

      <header id="topbar-shell" className={collapsed ? "topbar topbarCollapsed" : "topbar"}>
        <div className="topbarBrand">
          <span className="brandDot" />
          <div>
            <strong>YouTube Success Prediction ML</strong>
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
    </>
  );
}
