"use client";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean>(false);

  useEffect(() => {
    // Initialize from localStorage or system preference
    const stored = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    const prefersDark =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = stored ? stored === "dark" : prefersDark;
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {}
  }

  return (
    <button
      onClick={toggle}
      className="rounded border p-2 bg-white/70 dark:bg-gray-800/70 backdrop-blur border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 hover:bg-white/90 dark:hover:bg-gray-800"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? (
        // Bootstrap "sun" icon (indicates switch to light)
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="h-4 w-4 fill-current">
          <path d="M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8" />
          <path d="M8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0m0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13M16 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 16 8M3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8m10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0M4.464 11.536a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0m9.193 9.193M11.536 11.536l1.414 1.414m-9.9-9.9a.5.5 0 0 1 0 .708L1.636 4.87a.5.5 0 1 1-.707-.707L2.343 2.75a.5.5 0 0 1 .707 0M13.657 13.657a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707" />
        </svg>
      ) : (
        // Bootstrap "moon" icon (indicates switch to dark)
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" className="h-4 w-4 fill-current">
          <path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278" />
        </svg>
      )}
    </button>
  );
}


