/**
 * Shipping update. The progress is an ordered list in words ("Step 2 of 4: Shipped, done"), never coloured dots alone,
 * so it reads the same aloud, in grey scale and in dark mode. The tracking number is grouped so it's read digit by digit.
 */
import { Button, Column, Heading, List, ListItem, Span, Text, prop, token } from "@hyper-elements/react";
import { template } from "@hyper-elements/react/template";
import { BRAND } from "../brand";
import { COPY, longDate } from "../copy";
import { group } from "../wcag/rules";
import { Fact, Facts, RULES, Shell, buttonStyle, localeField } from "./shared";

export const CARRIERS = {
  DHL: (n: string) => `https://www.dhl.de/en/privatkunden/pakete-empfangen/verfolgen.html?piececode=${n}`,
  UPS: (n: string) => `https://www.ups.com/track?tracknum=${n}`,
  "La Poste": (n: string) => `https://www.laposte.fr/outils/suivre-vos-envois?code=${n}`,
} as const;
type Carrier = keyof typeof CARRIERS;

/** Long runs of digits in groups, so a screen reader reads them out one by one: 00340434161094015902 → 0034 0434 1610 9401 5902. */
const readableCode = (s: string) => s.replace(/\d{6,}/g, (d) => group(d));

export const ShippingUpdate = template({
  id: "readable.ShippingUpdate",
  version: "1.0.0",
  label: "Shipping update",
  description: "Sent when a parcel ships, is out for delivery, or is delivered: where it is, when it arrives, how to track it",
  root: "Email",
  fields: {
    locale: localeField,
    orderNumber: prop.text({ label: "Order number", required: true, pattern: "^FH-[0-9]{4,5}$" }),
    status: prop.choice(["shipped", "out", "delivered"], { label: "Status", default: "shipped" }),
    carrier: prop.choice(Object.keys(CARRIERS) as Carrier[], { label: "Carrier", default: "DHL" }),
    trackingNumber: prop.text({ label: "Tracking number", required: true, pattern: "^[A-Z0-9]{8,30}$", guidance: "As the carrier gives it: the template groups its digits so it's read out one by one" }),
    date: prop.date({ label: "Expected (or actual) delivery date", required: true }),
    items: prop.list(prop.text({ label: "Item", required: true, maxLength: 70 }), { label: "Items in this parcel", required: true, min: 1, max: 20 }),
  },
  rules: RULES,
  example: {
    locale: "en",
    orderNumber: "FH-20481",
    status: "shipped",
    carrier: "DHL",
    trackingNumber: "00340434161094015902",
    date: "2026-12-02",
    items: ["Linen bedding set, sage, double", "Stoneware mug, oat (2)", "Beeswax candle, large"],
  },
  render: (v) => {
    const l = v.locale;
    const t = COPY.shipping[l];
    const when = longDate(v.date, l);
    const current = { shipped: 1, out: 2, delivered: 3 }[v.status];
    const intro = v.status === "out" ? t.intro.out(v.carrier) : t.intro[v.status](v.carrier, when);
    return (
      <Shell locale={l} title={`${BRAND.name}: ${t.title(v.orderNumber)}`} preview={t.preview(v.carrier, when)}>
        <Column style={{ gap: token("spacing.sm") }}>
          <Heading level={1} field="status">{t.heading[v.status]}</Heading>
          <Text style={{ fontSize: token("fontSizes.lead") }}>{intro}</Text>
        </Column>

        <Column style={{ gap: token("spacing.sm") }}>
          <Heading level={2}>{t.progress}</Heading>
          <List type="number" style={{ gap: token("spacing.xs") }}>
            {t.steps.map((step, i) => {
              const state = i < current ? t.state.done : i === current ? t.state.now : t.state.next;
              return (
                <ListItem key={i}>
                  <Span style={{ fontWeight: i === current ? 700 : 400 }}>{step}</Span>
                  <Span style={{ color: token("colors.muted") }}>{` (${state})`}</Span>
                </ListItem>
              );
            })}
          </List>
        </Column>

        <Facts>
          <Fact label={t.carrier} field="carrier">{v.carrier}</Fact>
          <Fact label={t.order} field="orderNumber">{v.orderNumber}</Fact>
        </Facts>
        <Fact label={t.tracking} field="trackingNumber">{readableCode(v.trackingNumber)}</Fact>

        <Button href={CARRIERS[v.carrier](v.trackingNumber)} style={buttonStyle}>{t.track(v.carrier)}</Button>

        <Column style={{ gap: token("spacing.xs") }}>
          <Heading level={2}>{t.inParcel}</Heading>
          <List style={{ gap: 2 }}>
            {v.items.map((item, i) => (
              <ListItem key={i} field={`items[${i}]`}>{item}</ListItem>
            ))}
          </List>
        </Column>
      </Shell>
    );
  },
});
