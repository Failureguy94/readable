/**
 * What a screen reader says, reading an email from top to bottom: a model of how NVDA and VoiceOver move through
 * HTML (headings and their level, links by their words, images by their alt or their file name, data tables with
 * their size and each cell's column, lists with their length), not a recording of one. Each line keeps its element,
 * so the page can show where the reader is.
 */
import { spoken } from "../src/wcag/rules";

export type Kind = "heading" | "link" | "image" | "text" | "table" | "cell" | "list" | "item";

export interface Line {
  el: Element;
  kind: Kind;
  /** What's said. */
  say: string;
  /** The language it's said in: the nearest lang attribute, or null when the email doesn't say. */
  lang: string | null;
  /** What's wrong with it, said plainly, where something is. */
  problem?: string;
  level?: number;
}

const PICTO = /\p{Emoji_Presentation}|\p{Extended_Pictographic}\uFE0F/u;
const LONG_DIGITS = /(?<![\d.,:/-])\d{6,}(?![\d.,:/-])/;
const GENERIC = /^(click here|here|read more|more|this link|link|click|learn more|view|go|tap here|hier klicken|hier|cliquez ici|ici)$/i;
const BLOCK = new Set(["P", "DIV", "TD", "TH", "TR", "TBODY", "THEAD", "TFOOT", "LI", "BR", "SECTION", "ARTICLE", "HEADER", "FOOTER", "CENTER", "BLOCKQUOTE", "HR", "BODY", "CAPTION"]);

const clean = (s: string) => s.replace(/[͏​-‍⁠﻿­]/g, "").replace(/\s+/g, " ").trim();
const fileName = (src: string) => decodeURIComponent(src.split(/[?#]/)[0]!.split("/").pop() || src);

/** An element's words as a screen reader takes them: its text, with each image's alt in place. */
function nameOf(el: Element): string {
  let out = "";
  el.childNodes.forEach((n) => {
    if (n.nodeType === 3) out += n.textContent ?? "";
    else if (n.nodeType === 1) {
      const e = n as Element;
      if (hidden(e)) return;
      if (e.tagName === "IMG") out += " " + (e.getAttribute("alt") ?? "") + " ";
      else if (e.tagName === "BR") out += " ";
      else out += nameOf(e);
    }
  });
  return clean(out);
}

function hidden(el: Element): boolean {
  if (el.getAttribute("aria-hidden") === "true" || el.hasAttribute("hidden")) return true;
  const view = el.ownerDocument.defaultView;
  const st = view?.getComputedStyle(el);
  return !!st && (st.display === "none" || st.visibility === "hidden" || (st.maxHeight === "0px" && st.overflow === "hidden"));
}

const langOf = (el: Element) => el.closest("[lang]")?.getAttribute("lang") || null;
const layout = (t: Element) => /^(presentation|none)$/i.test(t.getAttribute("role") ?? "");

export function readAloud(doc: Document): Line[] {
  const lines: Line[] = [];
  let buffer = "";
  let bufferEl: Element | null = null;

  const push = (el: Element, kind: Kind, say: string, problem?: string, level?: number) => {
    const digits = LONG_DIGITS.exec(say);
    problem ??= PICTO.test(say) ? "Every emoji is read out by its full name" : digits ? `"${digits[0]}" is read as one big number, not as digits` : undefined;
    lines.push({ el, kind, say: spoken(say), lang: langOf(el), problem, level });
  };
  const flush = () => {
    const t = clean(buffer);
    if (t && bufferEl) push(bufferEl, "text", t);
    buffer = "";
    bufferEl = null;
  };

  const blockOf = (n: Node): Element => {
    let e = n.parentElement!;
    while (e.parentElement && !BLOCK.has(e.tagName) && !/^H[1-6]$/.test(e.tagName)) e = e.parentElement;
    return e;
  };

  const walk = (node: Node) => {
    if (node.nodeType === 3) {
      const t = node.textContent ?? "";
      if (!t.trim()) {
        buffer += t;
        return;
      }
      const b = blockOf(node);
      if (bufferEl && bufferEl !== b && !bufferEl.contains(b) && !b.contains(bufferEl)) flush();
      bufferEl ??= b;
      buffer += t;
      return;
    }
    if (node.nodeType !== 1) return;
    const el = node as Element;
    const tag = el.tagName;
    if (["HEAD", "STYLE", "SCRIPT", "TITLE", "META", "NOSCRIPT", "TEMPLATE"].includes(tag) || hidden(el)) return;

    if (/^H[1-6]$/.test(tag)) {
      flush();
      const level = +tag[1]!;
      const name = nameOf(el);
      if (name) push(el, "heading", `Heading level ${level}, ${name}`, undefined, level);
      return;
    }
    if (tag === "A" && el.hasAttribute("href")) {
      flush();
      const label = el.getAttribute("aria-label") || nameOf(el) || el.getAttribute("title") || "";
      const href = el.getAttribute("href") ?? "";
      if (!label) push(el, "link", `Link, ${fileName(href)}`, "This link has no words: the reader says its address");
      else push(el, "link", `Link, ${label}`, GENERIC.test(label) ? `"${label}" doesn't say where the link goes` : undefined);
      return;
    }
    if (tag === "IMG") {
      flush();
      const alt = el.getAttribute("alt");
      if (alt === "" || el.getAttribute("role") === "presentation") return;
      if (alt === null) push(el, "image", `Image, ${fileName(el.getAttribute("src") ?? "")}`, "No alt text: the reader says the file name");
      else if (/\.(png|jpe?g|gif|svg|webp)$/i.test(alt) || /^(image|logo|banner|photo|img|picture)$/i.test(alt.trim())) push(el, "image", `Image, ${alt}`, `"${alt}" doesn't say what the image shows`);
      else push(el, "image", `Image, ${alt}`);
      return;
    }
    if (tag === "TABLE" && !layout(el)) {
      flush();
      const rows = [...el.querySelectorAll(":scope > tbody > tr, :scope > thead > tr, :scope > tfoot > tr, :scope > tr")];
      const cols = Math.max(0, ...rows.map((r) => [...r.children].reduce((n, c) => n + (+(c.getAttribute("colspan") ?? 1) || 1), 0)));
      const headers = rows.find((r) => r.querySelector(":scope > th"));
      const names = headers ? [...headers.children].map((c) => nameOf(c)) : [];
      push(el, "table", `Table, ${rows.length} row${rows.length === 1 ? "" : "s"}, ${cols} column${cols === 1 ? "" : "s"}`, headers ? undefined : "No header cells: a layout or data table the reader can't make sense of");
      for (const r of rows) {
        let col = 0;
        for (const cell of r.children) {
          const text = nameOf(cell);
          const head = cell.tagName === "TD" && names[col] && r !== headers ? `${names[col]}, ` : "";
          col += +(cell.getAttribute("colspan") ?? 1) || 1;
          if (!text) continue;
          // A cell that holds links: its words, then each link as the reader reaches it.
          const links = [...cell.querySelectorAll("a[href]")];
          if (links.length && !cell.querySelector("table")) {
            push(cell, "cell", head + text);
            links.forEach((a) => {
              const label = a.getAttribute("aria-label") || nameOf(a);
              push(a, "link", `Link, ${label || fileName(a.getAttribute("href") ?? "")}`, GENERIC.test(label) ? `"${label}" doesn't say where the link goes` : undefined);
            });
          } else if (cell.querySelector("table, h1, h2, h3, img")) cell.childNodes.forEach(walk);
          else push(cell, "cell", head + text);
        }
      }
      return;
    }
    if ((tag === "UL" || tag === "OL") && el.getAttribute("role") !== "presentation") {
      flush();
      const items = [...el.children].filter((c) => c.tagName === "LI");
      push(el, "list", `List, ${items.length} item${items.length === 1 ? "" : "s"}`);
      items.forEach((li, i) => {
        const text = nameOf(li);
        if (text) push(li, "item", tag === "OL" ? `${i + 1}. ${text}` : `Bullet, ${text}`);
      });
      return;
    }
    const block = BLOCK.has(tag);
    if (block) flush();
    el.childNodes.forEach(walk);
    if (block) flush();
  };

  walk(doc.body);
  flush();
  return lines;
}

/** Speaks lines one after the other in the browser's own voice for each line's language, and says where it is. */
export class Reader {
  private i = 0;
  private stopped = true;
  rate = 1.05;
  onLine: (i: number) => void = () => {};
  onEnd: () => void = () => {};
  constructor(private lines: Line[], private fallbackLang = "en") {}

  static available() {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  play(from = 0) {
    this.stop();
    this.stopped = false;
    this.i = from;
    this.next();
  }

  stop() {
    this.stopped = true;
    if (Reader.available()) speechSynthesis.cancel();
  }

  private next() {
    if (this.stopped) return;
    if (this.i >= this.lines.length) {
      this.stopped = true;
      this.onEnd();
      return;
    }
    const line = this.lines[this.i]!;
    this.onLine(this.i);
    const u = new SpeechSynthesisUtterance(line.say);
    // With no lang on the email, the reader uses its own default voice: an English voice reading German, as it would.
    const lang = line.lang ?? this.fallbackLang;
    u.lang = lang;
    const voice = speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith(lang.toLowerCase().slice(0, 2)));
    if (voice) u.voice = voice;
    u.rate = this.rate;
    u.onend = () => {
      this.i++;
      this.next();
    };
    u.onerror = () => {
      this.i++;
      this.next();
    };
    speechSynthesis.speak(u);
  }
}
