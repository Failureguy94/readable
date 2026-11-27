/**
 * The same four emails, built the way transactional emails usually are. Nothing here is invented: each mistake is a
 * common one (a banner image of text, a code in one block of digits, "click here", grey small print, a progress bar
 * in colour only, the dir="rtl" column swap, a legacy footer pasted in as HTML). Hyper Elements renders them happily;
 * Readable's plugin says what's wrong with each, and the site reads them aloud.
 */
import type { ReactElement } from "react";
import { Button, Column, Email, Heading, Html, Image, Link, Row, Section, Social, Table, TableCell, TableRow, Text } from "@hyper-elements/react";
import { ASSETS } from "./brand";

const grey = "#9aa0a6";
const pink = "#ff5c8a";

const legacyFooter = `<table width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial,sans-serif;font-size:11px;color:#b0b0b0">
<tr><td align="center" style="padding:16px">© 2026 FERNHILL GOODS GMBH. ALL RIGHTS RESERVED.</td></tr>
<tr><td align="center"><a href="https://fernhill.example/privacy" style="color:#b0b0b0;text-decoration:none">Privacy</a> | <a href="https://fernhill.example/terms" style="color:#b0b0b0;text-decoration:none">Terms</a></td></tr>
</table>`;

function Frame(props: { children: ReactElement | ReactElement[]; preview?: string }) {
  return (
    <Email width={600} previewText={props.preview} style={{ backgroundColor: "#ffffff", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 14, lineHeight: 1.3, color: "#333333" }}>
      <Section style={{ padding: 20 }}>
        <Image src={`${ASSETS}/fernhill.png`} alt="logo" style={{ width: 132 }} />
      </Section>
      {props.children}
      <Section style={{ padding: [10, 20] }}>
        <Social icons={[{ name: "instagram", href: "https://instagram.com/fernhill" }, { name: "facebook", href: "https://facebook.com/fernhill" }]} size={18} />
      </Section>
      <Html html={legacyFooter} />
    </Email>
  );
}

const orderConfirmation = (
  <Frame preview="Order">
    <Section style={{ padding: [0, 20] }}>
      <Image src={`${ASSETS}/banner.png`} alt="banner_final_v2.png" style={{ width: 560 }} />
    </Section>
    <Section style={{ padding: 20 }}>
      <Heading level={3} style={{ textAlign: "center", color: pink }}>🎉 Order Confirmed! 🎉</Heading>
      <Text style={{ textAlign: "justify", color: grey, fontSize: 13 }}>
        Hi Amira, thank you so much for shopping with us! We have received your order #100204816 and our team is already getting it ready for you. We will let you know as soon as it ships.
      </Text>
      <Text style={{ fontSize: 12, color: grey }}>YOUR ORDER WILL SHIP WITHIN 2-3 BUSINESS DAYS</Text>
      <Table style={{ cellPadding: 6 }}>
        <TableRow><TableCell>Linen bedding set, sage, double</TableCell><TableCell>1</TableCell><TableCell>€129.00</TableCell></TableRow>
        <TableRow><TableCell>Stoneware mug, oat</TableCell><TableCell>2</TableCell><TableCell>€36.00</TableCell></TableRow>
        <TableRow><TableCell>Beeswax candle, large</TableCell><TableCell>1</TableCell><TableCell>€18.50</TableCell></TableRow>
        <TableRow><TableCell>Total</TableCell><TableCell>{" "}</TableCell><TableCell>€183.50</TableCell></TableRow>
      </Table>
      <Row dir="rtl" style={{ gap: 12 }}>
        <Column><Text style={{ color: grey }}>Delivering to Amira Haddad, Schönhauser Allee 41, 10435 Berlin</Text></Column>
        <Column><Text style={{ fontWeight: 700 }}>Shipping address</Text></Column>
      </Row>
      <Text>
        To see your order <Link href="https://fernhill.example/orders/100204816" style={{ color: "#333333", textDecoration: "none", fontWeight: 700 }}>click here</Link>.
      </Text>
      <Button href="https://fernhill.example/orders/100204816" style={{ backgroundColor: "#ffc2d1", color: "#ffffff", padding: [3, 10], fontSize: 11, borderRadius: 12 }}>VIEW ORDER</Button>
    </Section>
  </Frame>
);

const shippingUpdate = (
  <Frame preview="Shipped!">
    <Section style={{ padding: 20 }}>
      <Heading level={2}>🚚 Your order is on its way!</Heading>
      <Text style={{ color: grey }}>Good news! Your package is on its way. Tracking number: 00340434161094015902</Text>
      <Row style={{ gap: 4 }}>
        <Column style={{ backgroundColor: "#2e7d32", padding: 4 }}><Text style={{ color: "#ffffff", fontSize: 10, textAlign: "center" }}>●</Text></Column>
        <Column style={{ backgroundColor: "#2e7d32", padding: 4 }}><Text style={{ color: "#ffffff", fontSize: 10, textAlign: "center" }}>●</Text></Column>
        <Column style={{ backgroundColor: "#e0e0e0", padding: 4 }}><Text style={{ color: "#ffffff", fontSize: 10, textAlign: "center" }}>●</Text></Column>
        <Column style={{ backgroundColor: "#e0e0e0", padding: 4 }}><Text style={{ color: "#ffffff", fontSize: 10, textAlign: "center" }}>●</Text></Column>
      </Row>
      <Text>
        Track your package <Link href="https://www.dhl.de/en/privatkunden/pakete-empfangen/verfolgen.html?piececode=00340434161094015902" style={{ color: "#4a4a4a", textDecoration: "none" }}>here</Link>.
      </Text>
      <Button href="https://www.dhl.de/en/privatkunden/pakete-empfangen/verfolgen.html?piececode=00340434161094015902" style={{ backgroundColor: "#c8e6c9", color: "#2e7d32", padding: [4, 12], fontSize: 12 }}>Track 🚚</Button>
    </Section>
  </Frame>
);

const passwordReset = (
  <Frame>
    <Section style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: 700 }}>Password reset</Text>
      <Text>Use this code to reset your password:</Text>
      <Text style={{ fontFamily: "'Courier New', monospace", fontSize: 32, fontWeight: 700, letterSpacing: 8, textAlign: "center" }}>482913</Text>
      <Text style={{ color: grey, fontSize: 12 }}>This code expires soon. IF YOU DID NOT REQUEST A PASSWORD RESET, PLEASE IGNORE THIS EMAIL.</Text>
      <Button href="https://fernhill.example/reset?token=q8Xk2mVd9TzLp4Ra" style={{ backgroundColor: "#1a73e8", color: "#ffffff", padding: [4, 10], fontSize: 12 }}>Click here</Button>
    </Section>
  </Frame>
);

const signInAlert = (
  <Frame preview="Security alert">
    <Section style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 700, color: "#ff4d4f" }}>⚠️ Security alert</Text>
      <Text style={{ textAlign: "center", lineHeight: 1.1 }}>
        We noticed a new sign-in to your account amira@example.com from Firefox on Windows near Lyon, France on 27/11/2026 at 09:12. If this was you, you can safely ignore this message. If this was not you, someone else may have your password and you should secure your account right away.
      </Text>
      <Text style={{ color: "#ff4d4f" }}>
        Wasn't you? <Link href="https://fernhill.example/account/security" style={{ color: "#ff4d4f", textDecoration: "none" }}>Click here</Link>
      </Text>
    </Section>
  </Frame>
);

/** By template slug: the typical version of each Readable email. */
export const BEFORE: Record<string, ReactElement> = {
  "order-confirmation": orderConfirmation,
  "shipping-update": shippingUpdate,
  "password-reset": passwordReset,
  "sign-in-alert": signInAlert,
};
