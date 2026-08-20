"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Icon from "./Icon";
import ThemeToggle from "./ThemeToggle";

const LINKS = [
  { href: "/", label: "Beranda" },
  { href: "/generator", label: "Generator" },
  { href: "/settings", label: "Atur AI" },
];

export default function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/70 bg-white/75 backdrop-blur-xl dark:border-zinc-800/70 dark:bg-zinc-950/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-white transition-transform duration-300 group-hover:rotate-12 dark:bg-white dark:text-zinc-900">
            <Icon name="sparkles" size={17} />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-zinc-900 dark:text-white">
            NgodingDi<span className="text-indigo-500 dark:text-indigo-400">AI</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/70 dark:hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/generator"
            className="hidden items-center gap-1.5 rounded-full bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-zinc-700 active:scale-95 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 sm:flex"
          >
            Mulai Generate
            <Icon name="arrowRight" size={15} />
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300 md:hidden"
            aria-label="Menu"
          >
            <Icon name={open ? "x" : "menu"} size={18} />
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-zinc-200/70 bg-white/95 px-4 py-3 backdrop-blur-xl dark:border-zinc-800/70 dark:bg-zinc-950/95 md:hidden">
          <div className="flex flex-col gap-1">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`rounded-2xl px-4 py-3 text-sm font-medium ${
                  pathname === l.href
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800/70"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/generator"
              onClick={() => setOpen(false)}
              className="mt-1 flex items-center justify-center gap-1.5 rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white dark:bg-white dark:text-zinc-900"
            >
              Mulai Generate <Icon name="arrowRight" size={15} />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
