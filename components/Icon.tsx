import React from "react";

const PATHS: Record<string, React.ReactNode> = {
  sparkles: (
    <>
      <path d="M12 3l1.9 4.6 4.6 1.9-4.6 1.9L12 16l-1.9-4.6L5.5 9.5l4.6-1.9L12 3z" />
      <path d="M19 14.5l.8 1.9 1.9.8-1.9.8-.8 1.9-.8-1.9-1.9-.8 1.9-.8.8-1.9z" />
    </>
  ),
  bolt: <path d="M13 2L4.5 13.5H11L9.5 22 19 10h-6.5L13 2z" />,
  zap: <path d="M13 2L4.5 13.5H11L9.5 22 19 10h-6.5L13 2z" />,
  sliders: (
    <>
      <path d="M4 7h16M4 17h16" />
      <circle cx="9" cy="7" r="2.2" />
      <circle cx="15" cy="17" r="2.2" />
    </>
  ),
  download: <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" />,
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2.5" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </>
  ),
  check: <path d="M4 12.5l5 5L20 6.5" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4l1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  arrowRight: <path d="M4 12h16m0 0l-6-6m6 6l-6 6" />,
  arrowUpRight: (
    <>
      <path d="M7 17L17 7m0 0H8m9 0v9" />
    </>
  ),
  fileText: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8M8 17h5" />
    </>
  ),
  palette: (
    <>
      <path d="M12 21a9 9 0 1 1 9-9c0 2.5-2 3-3.5 3H15a2 2 0 0 0-1.5 3.3c.6.8.2 2.7-1.5 2.7z" />
      <circle cx="7.5" cy="11.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="10.5" cy="7.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="8" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  map: (
    <>
      <path d="M9 3L3 6v15l6-3 6 3 6-3V3l-6 3-6-3z" />
      <path d="M9 3v15M15 6v15" />
    </>
  ),
  cpu: (
    <>
      <rect x="6" y="6" width="12" height="12" rx="2.5" />
      <rect x="10" y="10" width="4" height="4" />
      <path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2" />
    </>
  ),
  shield: <path d="M12 22s8-3.5 8-10V5l-8-3-8 3v7c0 6.5 8 10 8 10z" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </>
  ),
  x: <path d="M6 6l12 12M18 6L6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  refresh: (
    <>
      <path d="M21 12a9 9 0 1 1-2.6-6.3" />
      <path d="M21 3v6h-6" />
    </>
  ),
  alert: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16.5v.5" />
    </>
  ),
  chevronDown: <path d="M6 9l6 6 6-6" />,
  play: <path d="M6 4l14 8-14 8V4z" />,
  layers: (
    <>
      <path d="M12 2l9 5-9 5-9-5 9-5z" />
      <path d="M3 12l9 5 9-5M3 17l9 5 9-5" />
    </>
  ),
  pen: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 3.6a3.5 3.5 0 0 1 0 8.8" />
      <path d="M21.5 20a6.5 6.5 0 0 0-4.5-6.1" />
    </>
  ),
  layout: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M3 9h18M9 9v12" />
    </>
  ),
  code: <path d="M8 6l-6 6 6 6M16 6l6 6-6 6" />,
  terminal: (
    <>
      <rect x="2" y="4" width="20" height="16" rx="3" />
      <path d="M6 9l3 3-3 3M12 15h6" />
    </>
  ),
  folder: (
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
  ),
  key: (
    <>
      <circle cx="7.5" cy="15.5" r="4.5" />
      <path d="M10.7 12.3L21 2m0 0h-6m6 0v6" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  star: (
    <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.8 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9L12 2.5z" />
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8v.5" />
    </>
  ),
  link: (
    <>
      <path d="M10 14a5 5 0 0 0 7.1 0l3-3a5 5 0 0 0-7.1-7.1l-1.5 1.5" />
      <path d="M14 10a5 5 0 0 0-7.1 0l-3 3a5 5 0 0 0 7.1 7.1l1.5-1.5" />
    </>
  ),
  box: (
    <>
      <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" />
      <path d="M3 8l9 5 9-5M12 13v8" />
    </>
  ),
  database: (
    <>
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
      <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
    </>
  ),
  gitBranch: (
    <>
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="6" r="3" />
      <path d="M6 9v6M18 9a6 6 0 0 1-6 6H9" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  upload: (
    <>
      <path d="M12 15V3m0 0L8 7m4-4l4 4" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M3 3l18 18" />
      <path d="M10.6 5.1A9.8 9.8 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.4 4.1" />
      <path d="M6.6 6.6A16.7 16.7 0 0 0 2 12s3.5 7 10 7a9.6 9.6 0 0 0 4.4-1" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </>
  ),
  send: (
    <>
      <path d="M22 2L11 13" />
      <path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </>
  ),
  gauge: (
    <>
      <path d="M5 19a9 9 0 1 1 14 0" />
      <path d="M12 15l4-5" />
      <circle cx="12" cy="15" r="1.5" fill="currentColor" stroke="none" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5l-2 5-5 2 2-5 5-2z" />
    </>
  ),
  rocket: (
    <>
      <path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2 0-2.8-.8-.8-2.2-.8-3 .8z" />
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.9A12.9 12.9 0 0 1 21.5 2.5c.6 5.2-1 8.8-6 10.4A22 22 0 0 1 12 15z" />
      <path d="M15 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z" />
    </>
  ),
  wand: (
    <>
      <path d="M15 4V2m0 14v-2M8 9H6m14 0h-2M17.8 6.2L19 5M7 15l-1.2 1.2M13.2 4.2L12 3" />
      <path d="M5 19L19 5l2 2L7 21l-2-2z" />
    </>
  ),
  filter: <path d="M4 5h16l-6.5 8v5l-3 2v-7L4 5z" />,
  clipboard: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="2.5" />
      <path d="M9 4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M8 11h8M8 15h5" />
    </>
  ),
  chevronRight: <path d="M9 6l6 6-6 6" />,
};

export type IconName = keyof typeof PATHS;

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}

export default function Icon({ name, size = 20, className, strokeWidth = 1.8 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name] ?? PATHS.info}
    </svg>
  );
}
