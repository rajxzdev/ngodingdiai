import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import Icon from "@/components/Icon";
import Link from "next/link";

export const metadata: Metadata = {
  title: "NgodingDiAI — PRD · Prompt · Design Generator (BYOK)",
  description:
    "Pipeline AI 8 role dari Prompt Engineering hingga Design Engineering. Output: prompt.md, design.md, map.md. BYOK — pilih provider & model sendiri.",
};

const THEME_INIT = `(function(){try{var t=localStorage.getItem("ngodingdiai.theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;if(d)document.documentElement.classList.add("dark");}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body className="min-h-screen bg-[#fafafa] font-sans text-zinc-900 antialiased transition-colors duration-300 dark:bg-[#09090b] dark:text-zinc-100">
        <Nav />
        {children}
        <footer className="border-t border-zinc-200/70 py-10 dark:border-zinc-800/70">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 sm:px-6 md:flex-row">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
                <Icon name="sparkles" size={14} />
              </span>
              <span className="text-sm font-semibold text-zinc-900 dark:text-white">
                NgodingDi<span className="text-indigo-500 dark:text-indigo-400">AI</span>
              </span>
              <span className="text-xs text-zinc-400">— PRD · Prompt · Design Generator</span>
            </div>
            <nav className="flex items-center gap-5 text-sm text-zinc-500 dark:text-zinc-400">
              <Link href="/" className="transition-colors hover:text-zinc-900 dark:hover:text-white">
                Beranda
              </Link>
              <Link href="/generator" className="transition-colors hover:text-zinc-900 dark:hover:text-white">
                Generator
              </Link>
              <Link href="/settings" className="transition-colors hover:text-zinc-900 dark:hover:text-white">
                Atur AI
              </Link>
            </nav>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              © {new Date().getFullYear()} NgodingDiAI · BYOK — API key milikmu, sepenuhnya di browser • ©RAJXZDEV.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
