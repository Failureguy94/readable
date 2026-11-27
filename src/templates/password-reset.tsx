/**
 * Password reset. The code is grouped (482 913) so a screen reader reads six digits, not "four hundred eighty-two
 * thousand…"; how long it works is said in minutes and as a time, with what to do when it runs out (WCAG 2.2.1).
 */
import { Button, Column, Heading, Text, prop, token } from "@hyper-elements/react";
import { template } from "@hyper-elements/react/template";
import { COPY } from "../copy";
import { BRAND } from "../brand";
import { group } from "../wcag/rules";
import { RULES, Shell, buttonStyle, localeField, small } from "./shared";

export const PasswordReset = template({
  id: "readable.PasswordReset",
  version: "1.0.0",
  label: "Password reset",
  description: "A one-time code and a link to reset a password, with how long they work and what to do if it wasn't you",
  root: "Email",
  fields: {
    locale: localeField,
    email: prop.text({ label: "Account email", required: true, pattern: "^[^@\\s]+@[^@\\s]+$" }),
    code: prop.text({ label: "One-time code", required: true, pattern: "^[0-9]{6}$", guidance: "Six digits: the template shows them in two groups of three" }),
    minutes: prop.number({ label: "Minutes the code works", required: true, min: 5, max: 60 }),
    expiresAt: prop.text({ label: "Time it stops working", required: true, pattern: "^([01][0-9]|2[0-3]):[0-5][0-9] [A-Z]{2,5}$", guidance: "In the customer's time zone: 14:30 CET" }),
    token: prop.text({ label: "Reset token", required: true, pattern: "^[A-Za-z0-9_-]{16,64}$" }),
  },
  rules: RULES,
  example: { locale: "en", email: "amira@example.com", code: "482913", minutes: 15, expiresAt: "14:30 CET", token: "q8Xk2mVd9TzLp4Ra" },
  render: (v) => {
    const t = COPY.reset[v.locale];
    return (
      <Shell locale={v.locale} title={t.title} preview={t.preview(v.minutes)} security>
        <Column style={{ gap: token("spacing.sm") }}>
          <Heading level={1}>{t.heading}</Heading>
          <Text style={{ fontSize: token("fontSizes.lead") }} field="email">{t.intro(v.email)}</Text>
        </Column>

        <Column
          style={{
            backgroundColor: token("colors.surface"),
            border: { width: 1, style: "solid", color: token("colors.border") },
            borderRadius: token("radii.md"),
            padding: [token("spacing.lg"), token("spacing.md")],
            gap: token("spacing.xs"),
          }}
        >
          <Text style={{ ...small, textAlign: "center" }}>{t.code}</Text>
          <Text field="code" style={{ fontSize: 34, fontWeight: 700, letterSpacing: 4, lineHeight: 1.3, textAlign: "center" }}>{group(v.code)}</Text>
        </Column>

        <Text field="minutes">{t.expires(v.minutes, v.expiresAt)}</Text>

        <Column style={{ gap: token("spacing.sm") }}>
          <Text>{t.or}</Text>
          <Button href={`https://${BRAND.domain}/reset?token=${v.token}`} style={buttonStyle}>{t.button}</Button>
        </Column>

        <Column style={{ gap: token("spacing.xs") }}>
          <Heading level={2}>{t.notMe}</Heading>
          <Text>{t.ignore}</Text>
        </Column>
      </Shell>
    );
  },
});
