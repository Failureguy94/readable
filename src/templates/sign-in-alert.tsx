/**
 * New sign-in alert. Two questions as headings, "Was this you?" and "Not you?", each with its answer: a screen reader
 * user jumps straight to the one that applies. The warning is in words and a heading, not a red banner.
 */
import { Button, Column, Heading, Text, prop, token } from "@hyper-elements/react";
import { template } from "@hyper-elements/react/template";
import { COPY, fullDate } from "../copy";
import { BRAND } from "../brand";
import { Fact, Facts, RULES, Shell, buttonStyle, localeField } from "./shared";

export const SignInAlert = template({
  id: "readable.SignInAlert",
  version: "1.0.0",
  label: "New sign-in alert",
  description: "Sent when an account is signed in to from a new device: the device, place and time, and what to do if it wasn't the customer",
  root: "Email",
  fields: {
    locale: localeField,
    email: prop.text({ label: "Account email", required: true, pattern: "^[^@\\s]+@[^@\\s]+$" }),
    device: prop.text({ label: "Device and browser", required: true, maxLength: 60, guidance: "In words: \"Firefox on Windows\"" }),
    place: prop.text({ label: "Approximate place", required: true, maxLength: 60 }),
    date: prop.date({ label: "Date", required: true }),
    time: prop.text({ label: "Time", required: true, pattern: "^([01][0-9]|2[0-3]):[0-5][0-9] [A-Z]{2,5}$" }),
  },
  rules: RULES,
  example: { locale: "en", email: "amira@example.com", device: "Firefox on Windows", place: "Lyon, France", date: "2026-11-27", time: "09:12 CET" },
  render: (v) => {
    const t = COPY.signin[v.locale];
    return (
      <Shell locale={v.locale} title={t.title} preview={t.preview(v.device, v.place)} security>
        <Column style={{ gap: token("spacing.sm") }}>
          <Heading level={1}>{t.heading}</Heading>
          <Text style={{ fontSize: token("fontSizes.lead") }} field="email">{t.intro(v.email)}</Text>
        </Column>

        <Column
          style={{
            backgroundColor: token("colors.surface"),
            border: { width: 1, style: "solid", color: token("colors.border") },
            borderRadius: token("radii.md"),
            padding: token("spacing.md"),
            gap: token("spacing.md"),
          }}
        >
          <Fact label={t.device} field="device">{v.device}</Fact>
          <Facts>
            <Fact label={t.place} field="place">{v.place}</Fact>
            <Fact label={t.time} field="time">{`${fullDate(v.date, v.locale)}, ${v.time}`}</Fact>
          </Facts>
        </Column>

        <Column style={{ gap: token("spacing.xs") }}>
          <Heading level={2}>{t.wasYou}</Heading>
          <Text>{t.fine}</Text>
        </Column>

        <Column
          style={{
            backgroundColor: token("colors.notice"),
            border: { width: 2, style: "solid", color: token("colors.noticeEdge") },
            borderRadius: token("radii.md"),
            padding: token("spacing.lg"),
            gap: token("spacing.sm"),
          }}
        >
          <Heading level={2}>{t.notYou}</Heading>
          <Text>{t.act}</Text>
          <Button href={`https://${BRAND.domain}/account/security`} style={buttonStyle}>{t.button}</Button>
        </Column>
      </Shell>
    );
  },
});
