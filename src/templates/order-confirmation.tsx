/**
 * Order confirmation. A screen reader hears: the heading, what happens next, the order's facts as label-value pairs,
 * a table whose every price is announced with its column, and one button that says which order it opens.
 */
import { Button, Column, Heading, Table, TableCell, TableRow, Text, prop, token } from "@hyper-elements/react";
import { template } from "@hyper-elements/react/template";
import { BRAND } from "../brand";
import { COPY, longDate, fullDate, money, dirOf } from "../copy";
import { Fact, Facts, RULES, Shell, buttonStyle, localeField, small } from "./shared";

export const OrderConfirmation = template({
  id: "readable.OrderConfirmation",
  version: "1.0.0",
  label: "Order confirmation",
  description: "Sent when an order is placed: what was ordered, what it cost, where it goes and when it arrives",
  guidance: "Send it within a minute of the order. Keep item names as the customer saw them in the shop.",
  root: "Email",
  fields: {
    locale: localeField,
    customer: prop.text({ label: "Customer's first name", required: true, maxLength: 40 }),
    orderNumber: prop.text({ label: "Order number", required: true, pattern: "^FH-[0-9]{4,5}$", guidance: "FH- and up to five digits, so it's read as a number a person can say back" }),
    placed: prop.date({ label: "Ordered on", required: true }),
    arrivesFrom: prop.date({ label: "Earliest delivery", required: true }),
    arrivesTo: prop.date({ label: "Latest delivery", required: true }),
    currency: prop.choice(["EUR", "GBP", "CHF"], { label: "Currency", default: "EUR" }),
    items: prop.list(
      prop.object(
        {
          name: prop.text({ label: "Item", required: true, maxLength: 70 }),
          quantity: prop.number({ label: "Quantity", required: true, min: 1, max: 99 }),
          price: prop.number({ label: "Line total", required: true, min: 0 }),
        },
        { label: "Line" },
      ),
      { label: "Items", required: true, min: 1, max: 20 },
    ),
    shipping: prop.number({ label: "Shipping", default: 0, min: 0 }),
    paymentMethod: prop.text({ label: "Paid with", required: true, maxLength: 40, guidance: "In words: \"Visa ending in 4242\", not \"VISA ****4242\", which is read as \"star star star star\"" }),
    address: prop.list(prop.text({ label: "Line", required: true, maxLength: 60 }), { label: "Delivery address", required: true, min: 2, max: 5 }),
  },
  rules: RULES,
  example: {
    locale: "en",
    customer: "Amira",
    orderNumber: "FH-20481",
    placed: "2026-11-27",
    arrivesFrom: "2026-12-01",
    arrivesTo: "2026-12-03",
    currency: "EUR",
    items: [
      { name: "Linen bedding set, sage, double", quantity: 1, price: 129 },
      { name: "Stoneware mug, oat", quantity: 2, price: 36 },
      { name: "Beeswax candle, large", quantity: 1, price: 18.5 },
    ],
    shipping: 0,
    paymentMethod: "Visa ending in 4242",
    address: ["Amira Haddad", "Schönhauser Allee 41", "10435 Berlin", "Germany"],
  },
  render: (v) => {
    const l = v.locale;
    const t = COPY.order[l];
    const fmt = (n: number) => money(n, v.currency, l);
    const subtotal = v.items.reduce((s, i) => s + i.price, 0);
    const total = subtotal + (v.shipping ?? 0);
    const start = dirOf(l) === "rtl" ? "right" : "left";
    const end = dirOf(l) === "rtl" ? "left" : "right";
    const line = (label: string, value: string, strong = false) => (
      <TableRow>
        <TableCell colSpan={2} style={{ textAlign: start, fontWeight: strong ? 700 : 400 }}>{label}</TableCell>
        <TableCell style={{ textAlign: end, fontWeight: strong ? 700 : 400 }}>{value}</TableCell>
      </TableRow>
    );
    return (
      <Shell locale={l} title={`${BRAND.name}: ${t.title(v.orderNumber)}`} preview={t.preview(v.customer, longDate(v.arrivesTo, l))}>
        <Column style={{ gap: token("spacing.sm") }}>
          <Heading level={1} field="customer">{t.heading(v.customer)}</Heading>
          <Text style={{ fontSize: token("fontSizes.lead") }}>{t.intro}</Text>
        </Column>
        <Facts>
          <Fact label={t.number} field="orderNumber">{v.orderNumber}</Fact>
          <Fact label={t.placed} field="placed">{fullDate(v.placed, l)}</Fact>
        </Facts>
        <Fact label={t.arrives} field="arrivesTo">{t.between(longDate(v.arrivesFrom, l), longDate(v.arrivesTo, l))}</Fact>

        <Column style={{ gap: token("spacing.sm") }}>
          <Heading level={2}>{t.itemsHeading}</Heading>
          <Table style={{ cellPadding: [10, 4], rowBorder: { width: 1, style: "solid", color: token("colors.border") } }}>
            <TableRow header>
              <TableCell style={{ ...small, textAlign: start, width: "58%" }}>{t.item}</TableCell>
              <TableCell style={{ ...small, textAlign: end, width: "18%" }}>{t.qty}</TableCell>
              <TableCell style={{ ...small, textAlign: end, width: "24%" }}>{t.price}</TableCell>
            </TableRow>
            {v.items.map((item, i) => (
              <TableRow key={i}>
                <TableCell field={`items[${i}].name`} style={{ textAlign: start }}>{item.name}</TableCell>
                <TableCell field={`items[${i}].quantity`} style={{ textAlign: end }}>{String(item.quantity)}</TableCell>
                <TableCell field={`items[${i}].price`} style={{ textAlign: end }}>{fmt(item.price)}</TableCell>
              </TableRow>
            ))}
            {line(t.subtotal, fmt(subtotal))}
            {line(t.shipping, (v.shipping ?? 0) > 0 ? fmt(v.shipping!) : t.free)}
            {line(t.total, fmt(total), true)}
          </Table>
        </Column>

        <Facts>
          <Fact label={t.paid} field="paymentMethod">{v.paymentMethod}</Fact>
          <Column style={{ gap: 2 }}>
            <Text style={small}>{t.shipTo}</Text>
            {v.address.map((a, i) => (
              <Text key={i} field={`address[${i}]`}>{a}</Text>
            ))}
          </Column>
        </Facts>

        <Button href={`https://${BRAND.domain}/orders/${v.orderNumber}`} style={buttonStyle}>{t.view(v.orderNumber)}</Button>
      </Shell>
    );
  },
});
