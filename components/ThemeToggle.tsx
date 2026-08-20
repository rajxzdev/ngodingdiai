"use client";

import { useEffect, useState } from "react";
import { getTheme, setTheme as persistTheme } from "@/lib/store";
import Icon from "./Icon";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(getTheme() === "dark");
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    persistTheme(next ? "dark" : "light");
  };

  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Aktifkan light mode" : "Aktifkan dark mode"}
      className="relative flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 transition-all duration-200 hover:border-zinc-300 hover:text-zinc-900 active:scale-95 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:text-white"
    >
      <span
        className={`absolute transition-all duration-300 ${
          dark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0"
        }`}
      >
        <Icon name="moon" size={17} />
      </span>
      <span
        className={`absolute transition-all duration-300 ${
          dark ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100"
        }`}
      >
        <Icon name="sun" size={17} />
      </span>
    </button>
  );
}
