/** WCAG 2 relative luminance and contrast. Colours as Hyper Elements resolves them: `#rgb`, `#rrggbb`, `#rrggbbaa`. */
export type RGB = [number, number, number];

export const parseHex = (value: unknown): RGB | null => {
  if (typeof value !== "string") return null;
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(value.trim());
  if (!m) return null;
  const h = m[1]!.length === 3 ? [...m[1]!].map((c) => c + c).join("") : m[1]!.slice(0, 6);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;
};

const channel = (v: number) => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

export const luminance = ([r, g, b]: RGB) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

/** The WCAG contrast ratio of two colours, 1 to 21, or null when either isn't a colour this can read. */
export const contrast = (a: unknown, b: unknown): number | null => {
  const x = parseHex(a);
  const y = parseHex(b);
  if (!x || !y) return null;
  const [hi, lo] = [luminance(x), luminance(y)].sort((p, q) => q - p) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};

export const ratio = (n: number) => `${(Math.floor(n * 100) / 100).toFixed(2)}:1`;
