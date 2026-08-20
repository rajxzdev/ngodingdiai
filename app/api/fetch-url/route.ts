import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

export interface WebInfo {
  ok: boolean;
  url: string;
  title?: string;
  description?: string;
  text?: string;
  error?: string;
  mode?: "desain" | "sistem" | "both";
}

const encoder = new TextEncoder();

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&[a-z]+;/g, " ");
}

/** Ekstrak teks kasar dari HTML: title, meta description, lalu body text tanpa script/style */
function parseHtml(html: string): { title: string; description: string; text: string } {
  let title = "";
  let description = "";
  const mTitle = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (mTitle) title = mTitle[1].replace(/\s+/g, " ").trim();

  const mDesc =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
  if (mDesc) description = mDesc[1].trim();

  // buang elemen yang tidak relevan
  let body = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");

  // ganti tag penutup blok dengan spasi agar teks tidak menempel
  body = body
    .replace(/<\/(p|div|section|article|li|h[1-6]|tr|br|ul|ol|header|footer|nav)>/gi, " \n")
    .replace(/<br\s*\/?>/gi, " \n")
    .replace(/<[^>]+>/g, " ");

  body = decodeEntities(body).replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();
  // batasi agar tidak membebani token
  if (body.length > 12000) body = body.slice(0, 12000) + "\n…(terpotong)";
  return { title, description, text: body };
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { url?: string; mode?: "desain" | "sistem" | "both" };
  let url = (body.url || "").trim();
  const mode = body.mode === "desain" || body.mode === "sistem" || body.mode === "both" ? body.mode : "both";

  // Otomatis tambahkan https:// jika user tidak menulis protocol
  if (url && !/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) url = "https://" + url;

  if (!url) return Response.json({ ok: false, url, error: "URL kosong" });

  let parsed: URL;
  try {
    parsed = new URL(url);
    if (!/^https?:$/.test(parsed.protocol)) throw new Error("hanya http/https");
  } catch {
    return Response.json({ ok: false, url, error: "URL tidak valid (harus http/https)" });
  }

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(parsed.toString(), {
      signal: ctrl.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; NgodingDiAI/1.0; +https://github.com/ngodingdiai) AppleWebKit/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    if (!res.ok) {
      return Response.json({
        ok: false,
        url,
        mode,
        error: `Server merespons HTTP ${res.status}${res.status === 403 ? " (diblokir website)" : res.status === 404 ? " (halaman tidak ditemukan)" : ""}`,
      });
    }
    const html = await res.text();
    const parsedHtml = parseHtml(html.slice(0, 500000));
    const result: WebInfo = {
      ok: true,
      url,
      mode,
      title: parsedHtml.title || parsed.toString(),
      description: parsedHtml.description,
      text: parsedHtml.text,
    };
    return Response.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({
      ok: false,
      url,
      mode,
      error: msg.includes("abort")
        ? "Timeout (15 detik) — website terlalu lambat"
        : msg.includes("fetch failed") || msg.includes("ENOTFOUND") || msg.includes("ECONNREFUSED")
          ? "Website tidak dapat dijangkau"
          : "Gagal mengambil halaman: " + msg.slice(0, 100),
    });
  } finally {
    clearTimeout(t);
  }
}
