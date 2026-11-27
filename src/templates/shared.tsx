/** What every Readable email shares: the rules it's held to, its frame (logo, card, footer) and its parts. */
import type { ReactNode } from "react";
import { Column, Divider, Email, Heading, Image, Link, Row, Text, prop, token } from "@hyper-elements/react";
import type { TemplateRules } from "@hyper-elements/react/template";
import { readable } from "../wcag";
import { BRAND, theme } from "../brand";
import { COPY, LOCALES, dirOf, type Locale } from "../copy";

const plugin = readable({ kind: "transactional" });

/**
 * Every rule that can run on a transactional email: all of lint's (but `title`, a Page's, and `unsubscribe`, a
 * marketing email's) and all of Readable's. Required, so any one of them finding anything fails the template.
 */
export const REQUIRED = plugin.rules.filter((r) => r.enabled && r.roots.includes("Email") && r.id !== "title").map((r) => r.id);

export const RULES: TemplateRules = {
  plugins: { lint: plugin },
  require: { lint: REQUIRED, core: ["layout/overflow"] },
  links: { domains: [BRAND.domain, `*.${BRAND.domain}`, "dhl.de", "*.dhl.de", "ups.com", "*.ups.com", "laposte.fr", "*.laposte.fr"], schemes: ["mailto"], tags: "deny" },
  root: { lang: true, title: true, previewText: true },
};

export const localeField = prop.choice(LOCALES, { label: "Language", default: "en", guidance: "The customer's language: every fixed word, the date and money formats and the reading direction follow it" });

export const small = { fontSize: token("fontSizes.small"), color: token("colors.muted") } as const;

export function Shell(props: { locale: Locale; title: string; preview: string; children: ReactNode; security?: boolean }) {
  const c = COPY.common[props.locale];
  const [help, answer] = c.help(BRAND.support);
  return (
    <Email
      width={600}
      lang={props.locale}
      dir={dirOf(props.locale)}
      title={props.title}
      previewText={props.preview}
      theme={theme}
      style={{ backgroundColor: token("colors.surface"), color: token("colors.foreground"), fontSize: token("fontSizes.body"), lineHeight: token("lineHeights.body") }}
    >
      <Column style={{ padding: [token("spacing.xl"), token("spacing.md")], gap: token("spacing.lg") }}>
        <Column style={{ padding: [0, token("spacing.sm")] }}>
          <Image src={{ src: BRAND.logo.src, width: BRAND.logo.width, height: BRAND.logo.height }} alt={BRAND.name} style={{ width: BRAND.logo.width }} />
        </Column>
        <Column
          style={{
            backgroundColor: token("colors.background"),
            borderRadius: token("radii.md"),
            border: { width: 1, style: "solid", color: token("colors.border") },
            padding: token("spacing.xl"),
            // 16 px on a phone, so a 320 px screen still has room for a price on one line.
            mobile: { padding: token("spacing.md") },
            gap: token("spacing.lg"),
          }}
        >
          {props.children}
        </Column>
        <Column style={{ padding: [0, token("spacing.sm")], gap: token("spacing.sm") }}>
          <Heading level={2} style={{ fontSize: 17 }}>{c.helpHeading}</Heading>
          <Text>
            {help} <Link href={`mailto:${BRAND.support}`} style={{ color: token("colors.link") }}>{BRAND.support}</Link>. {answer}
          </Text>
          {props.security && <Text>{c.never}</Text>}
          <Divider style={{ borderTop: { width: 1, style: "solid", color: token("colors.border") } }} />
          <Text style={small}>{c.why}</Text>
          <Text style={small}>{BRAND.address}</Text>
        </Column>
      </Column>
    </Email>
  );
}

/** A label and its value, read as a pair: "Order number, FH-20481". */
export function Fact(props: { label: string; children: ReactNode; field?: string }) {
  return (
    <Column style={{ gap: 2 }}>
      <Text style={small}>{props.label}</Text>
      <Text field={props.field} style={{ fontWeight: 700 }}>{props.children}</Text>
    </Column>
  );
}

export function Facts(props: { children: ReactNode }) {
  return <Row style={{ gap: token("spacing.md") }}>{props.children}</Row>;
}

export const buttonStyle = {
  backgroundColor: token("colors.primary"),
  color: token("colors.primaryForeground"),
  borderRadius: token("radii.sm"),
  fontSize: 17,
  fontWeight: 700,
  lineHeight: 1.3,
  padding: [14, 24],
} as const;
