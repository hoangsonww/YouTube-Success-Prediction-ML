(() => {
  const progress = document.getElementById("scroll-progress");
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.getElementById("nav-links");
  const navAnchors = Array.from(document.querySelectorAll(".nav-links a"));
  const sections = Array.from(document.querySelectorAll("main section[id]"));
  const revealItems = document.querySelectorAll(".reveal");
  const copyButtons = Array.from(document.querySelectorAll(".copy-btn"));
  const backTop = document.getElementById("back-to-top");
  const checklistInputs = Array.from(document.querySelectorAll("[data-check-item]"));
  const checklistProgress = document.getElementById("checklist-progress");
  const numberFmt = new Intl.NumberFormat("en-US");

  const updateProgress = () => {
    const doc = document.documentElement;
    const total = doc.scrollHeight - doc.clientHeight;
    const pct = total > 0 ? (window.scrollY / total) * 100 : 0;
    if (progress) {
      progress.style.width = `${Math.min(100, Math.max(0, pct))}%`;
    }

    if (backTop) {
      backTop.classList.toggle("show", window.scrollY > 560);
    }
  };

  const closeMenu = () => {
    if (!navLinks || !navToggle) return;
    navLinks.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  };

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const next = !navLinks.classList.contains("open");
      navLinks.classList.toggle("open", next);
      navToggle.setAttribute("aria-expanded", String(next));
    });

    navAnchors.forEach((a) => a.addEventListener("click", closeMenu));
  }

  const getHeaderOffset = () => {
    const topbar = document.querySelector(".topbar");
    const topbarHeight = topbar ? topbar.getBoundingClientRect().height : 0;
    return Math.ceil(topbarHeight + 12);
  };

  const setActiveNavByScroll = () => {
    if (sections.length === 0 || navAnchors.length === 0) return;

    const scrollMark = window.scrollY + getHeaderOffset();
    let activeId = sections[0].id;

    sections.forEach((section) => {
      if (section.offsetTop <= scrollMark) {
        activeId = section.id;
      }
    });

    const nearBottom =
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8;
    if (nearBottom) {
      activeId = sections[sections.length - 1].id;
    }

    navAnchors.forEach((anchor) => {
      const isActive = anchor.getAttribute("href") === `#${activeId}`;
      anchor.classList.toggle("active", isActive);
    });
  };

  const revealObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in-view");
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.12 }
  );

  revealItems.forEach((item) => revealObserver.observe(item));

  const animateCounter = (el) => {
    if (el.dataset.counted === "true") return;
    const target = Number(el.getAttribute("data-count") || "0");
    if (!Number.isFinite(target)) return;
    const duration = Number(el.getAttribute("data-count-duration") || 1200);
    const start = performance.now();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      el.textContent = numberFmt.format(Math.round(target));
      el.dataset.counted = "true";
      return;
    }

    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = numberFmt.format(Math.round(target * eased));
      if (p < 1) {
        requestAnimationFrame(tick);
      } else {
        el.dataset.counted = "true";
      }
    };

    requestAnimationFrame(tick);
  };

  const counterObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.18 }
  );

  document.querySelectorAll("[data-count]").forEach((el) => counterObserver.observe(el));

  const initMermaid = () => {
    if (typeof mermaid === "undefined") return;
    mermaid.initialize({
      startOnLoad: true,
      securityLevel: "loose",
      theme: "dark",
      themeVariables: {
        fontFamily: "Space Grotesk, IBM Plex Sans, sans-serif",
        primaryColor: "#10213d",
        primaryTextColor: "#e8eefb",
        primaryBorderColor: "#4f95ff",
        lineColor: "#8eb7ff",
        secondaryColor: "#133058",
        tertiaryColor: "#0a162d",
      },
    });
  };

  copyButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-copy-target");
      if (!id) return;
      const source = document.getElementById(id);
      if (!source) return;
      const text = source.innerText;
      try {
        await navigator.clipboard.writeText(text);
        btn.classList.add("copied");
        btn.textContent = "Copied";
        setTimeout(() => {
          btn.classList.remove("copied");
          btn.textContent = "Copy";
        }, 1200);
      } catch {
        btn.textContent = "Copy failed";
      }
    });
  });

  if (backTop) {
    backTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  const CHECKLIST_KEY = "yts_release_checklist";
  const persisted = JSON.parse(localStorage.getItem(CHECKLIST_KEY) || "{}");
  checklistInputs.forEach((el) => {
    const key = el.getAttribute("data-check-item");
    if (!key) return;
    if (persisted[key]) {
      el.checked = true;
    }
  });

  const renderChecklistProgress = () => {
    const total = checklistInputs.length;
    const done = checklistInputs.filter((el) => el.checked).length;
    if (checklistProgress) checklistProgress.textContent = `${done}/${total}`;
  };

  checklistInputs.forEach((el) => {
    el.addEventListener("change", () => {
      const payload = {};
      checklistInputs.forEach((item) => {
        const key = item.getAttribute("data-check-item");
        if (!key) return;
        payload[key] = item.checked;
      });
      localStorage.setItem(CHECKLIST_KEY, JSON.stringify(payload));
      renderChecklistProgress();
    });
  });

  let ticking = false;
  const onScrollOrResize = () => {
    updateProgress();
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(() => {
      setActiveNavByScroll();
      ticking = false;
    });
  };

  initMermaid();
  renderChecklistProgress();
  onScrollOrResize();
  window.addEventListener("scroll", onScrollOrResize, { passive: true });
  window.addEventListener("resize", onScrollOrResize);
})();
