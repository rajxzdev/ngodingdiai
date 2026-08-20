"use client";

import { useEffect, useRef, useState } from "react";

const CHARS = "!<>-_\\/[]{}—=+*^?#________";

/**
 * Text Scramble — ala React Bits. Teks "diacak" lalu merapikan jadi kata penuh
 * saat elemen masuk viewport. Tanpa dependency.
 */
export default function TextScramble({
  text,
  className = "",
  duration = 1400,
  delay = 0,
}: {
  text: string;
  className?: string;
  duration?: number;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(text);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let frame = 0;
    let timer = 0;

    const run = () => {
      if (started.current) return;
      started.current = true;
      const start = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - start) / duration);
        const reveal = Math.floor(p * text.length);
        let out = "";
        for (let i = 0; i < text.length; i++) {
          if (i < reveal || text[i] === " ") out += text[i];
          else out += CHARS[Math.floor(Math.random() * CHARS.length)];
        }
        setDisplay(out);
        if (p < 1) raf = requestAnimationFrame(step);
        else setDisplay(text);
      };
      raf = requestAnimationFrame(step);
    };

    if (typeof IntersectionObserver === "undefined") {
      timer = window.setTimeout(run, delay);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(timer);
      };
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          timer = window.setTimeout(run, delay);
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [text, duration, delay]);

  return (
    <span ref={ref} className={className} aria-label={text}>
      {display}
    </span>
  );
}
