/**
 * The sender: a fictional EU shop, and its theme. Every colour pair here is checked by the templates' required
 * contrast rule, and the button's colours by `non-text-contrast`: a brand that changes them is checked the same way.
 */
import { defineTheme } from "@hyper-elements/react";
import { SITE_URL } from "./config";

/** Where the emails' images are served from: the live site, or SITE_URL. */
export const ASSETS = SITE_URL;

export const BRAND = {
  name: "Fernhill",
  domain: "fernhill.example",
  address: "Fernhill Goods GmbH · Lindenstraße 12 · 10969 Berlin · Germany",
  support: "help@fernhill.example",
  logo: { src: `${ASSETS}/fernhill.png`, width: 132, height: 32 },
};

export const theme = defineTheme({
  colors: {
    background: "#ffffff",
    foreground: "#1b1f23",
    muted: "#4b5563", // 7.56:1 on white, 7.08:1 on the page
    primary: "#1d5c47", // the button: 7.6:1 against white text, and against the white card behind it
    primaryForeground: "#ffffff",
    link: "#1d5c47",
    surface: "#f3f5f4",
    border: "#d4dbd8",
    notice: "#fdf6e3",
    noticeEdge: "#8a6d1c",
  },
  fonts: { body: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif" },
  fontSizes: { body: 16, small: 15, lead: 18 },
  lineHeights: { body: 1.6, heading: 1.3 },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  radii: { sm: 6, md: 10 },
  elements: {
    Heading: { fontWeight: 700, by: { level: { 1: { fontSize: 26 }, 2: { fontSize: 19 } } } },
  },
});
