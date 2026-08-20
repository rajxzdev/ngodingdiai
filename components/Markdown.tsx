import React from "react";

/** Render inline markdown: **bold**, *italic*, `code`, [link](url) */
function renderInline(text: string, keyBase: string): React.ReactNode[] {
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(regex);
  return parts.map((part, i) => {
    const key = `${keyBase}-${i}`;
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={key}>{part.slice(1, -1)}</code>;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      return (
        <a key={key} href={link[2]} target="_blank" rel="noreferrer">
          {link[1]}
        </a>
      );
    }
    return <React.Fragment key={key}>{part}</React.Fragment>;
  });
}

/** Renderer markdown minimal (headings, list, tabel, kode, quote, dll.) */
export default function Markdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  const push = (el: React.ReactNode) => blocks.push(<React.Fragment key={key++}>{el}</React.Fragment>);

  while (i < lines.length) {
    const line = lines[i];

    // code fence
    if (line.trim().startsWith("```")) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        buf.push(lines[i]);
        i++;
      }
      i++; // skip closing fence
      push(
        <pre>
          <code>{buf.join("\n")}</code>
        </pre>
      );
      continue;
    }

    // heading
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const Tag = (`h${level}`) as keyof React.JSX.IntrinsicElements;
      push(<Tag>{renderInline(h[2], `h${key}`)}</Tag>);
      i++;
      continue;
    }

    // hr
    if (/^\s*---+\s*$/.test(line)) {
      push(<hr />);
      i++;
      continue;
    }

    // blockquote (consecutive)
    if (line.trim().startsWith(">")) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        buf.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      push(
        <blockquote>
          {buf.map((b, j) => (
            <p key={j}>{renderInline(b, `q${key}-${j}`)}</p>
          ))}
        </blockquote>
      );
      continue;
    }

    // table
    if (line.trim().startsWith("|") && i + 1 < lines.length && /^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      const header = line
        .split("|")
        .map((c) => c.trim())
        .filter((c, idx, arr) => !(idx === 0 && c === "") && !(idx === arr.length - 1 && c === ""));
      i += 2; // skip header + separator
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        const cells = lines[i]
          .split("|")
          .map((c) => c.trim())
          .filter((c, idx, arr) => !(idx === 0 && c === "") && !(idx === arr.length - 1 && c === ""));
        rows.push(cells);
        i++;
      }
      push(
        <table>
          <thead>
            <tr>
              {header.map((h, j) => (
                <th key={j}>{renderInline(h, `th${key}-${j}`)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, j) => (
              <tr key={j}>
                {r.map((c, k) => (
                  <td key={k}>{renderInline(c, `td${key}-${j}-${k}`)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
      continue;
    }

    // list (consecutive)
    const ulMatch = line.match(/^\s*[-*+]\s+(.*)$/);
    if (ulMatch) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*+]\s+/, ""));
        i++;
      }
      push(
        <ul>
          {items.map((it, j) => (
            <li key={j}>{renderInline(it, `ul${key}-${j}`)}</li>
          ))}
        </ul>
      );
      continue;
    }
    const olMatch = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (olMatch) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+[.)]\s+/, ""));
        i++;
      }
      push(
        <ol>
          {items.map((it, j) => (
            <li key={j}>{renderInline(it, `ol${key}-${j}`)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // paragraph (consecutive non-empty)
    if (line.trim() !== "") {
      const buf: string[] = [line];
      i++;
      while (
        i < lines.length &&
        lines[i].trim() !== "" &&
        !lines[i].trim().startsWith("#") &&
        !lines[i].trim().startsWith("```") &&
        !lines[i].trim().startsWith("|") &&
        !/^\s*[-*+]\s+/.test(lines[i]) &&
        !/^\s*\d+[.)]\s+/.test(lines[i]) &&
        !lines[i].trim().startsWith(">")
      ) {
        buf.push(lines[i]);
        i++;
      }
      push(
        <p>
          {buf.map((b, j) => (
            <React.Fragment key={j}>
              {j > 0 && <br />}
              {renderInline(b, `p${key}-${j}`)}
            </React.Fragment>
          ))}
        </p>
      );
      continue;
    }

    i++;
  }

  return <div className="md-body">{blocks}</div>;
}
