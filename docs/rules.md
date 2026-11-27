# Readable's rules

`readable()` is a lint plugin for Hyper Elements: it runs `@hyper-elements/lint` and adds these rules, described the way lint describes its own, so a template requires them in `rules.require.lint`. Each finding is `email/lint-<rule>` (or `page/lint-<rule>`), with its `fix` and a link here.

This file is generated from [`src/wcag/rules.ts`](../src/wcag/rules.ts) by `npm run build`.

| Rule | WCAG 2.2 | Level | Severity |
| --- | --- | --- | --- |
| [`target-size`](#target-size) | 2.5.8 | AA | warning |
| [`non-text-contrast`](#non-text-contrast) | 1.4.11 | AA | warning |
| [`link-distinct`](#link-distinct) | 1.4.1 | A | warning |
| [`headings`](#headings) | 1.3.1, 2.4.6 | AA | warning |
| [`table-header`](#table-header) | 1.3.1 | A | warning |
| [`reading-order`](#reading-order) | 1.3.2 | A | warning |
| [`code-readout`](#code-readout) | 1.3.1 | Best practice | warning |
| [`emoji`](#emoji) | 1.1.1, 2.4.6 | Best practice | warning |
| [`all-caps`](#all-caps) | 1.4.8 | Best practice | info |
| [`justified`](#justified) | 1.4.8 | AAA | warning |
| [`line-height`](#line-height) | 1.4.8, 1.4.12 | AAA | warning |
| [`centered-text`](#centered-text) | 1.4.8 | Best practice | info |
| [`layout-table`](#layout-table) | 1.3.1 | A | warning |

## target-size

**Buttons big enough to tap.** A button (or a social icon) is smaller than 24×24 px, too small to tap reliably with a finger or a tremor.

- **Why:** People with tremors, limited dexterity or large fingers miss small targets, and most transactional emails are opened on a phone.
- **Fix:** Give the button padding so it's at least 24 px tall and wide; 44 px is better on phones.
- **WCAG 2.2:** 2.5.8 Target size (minimum) (AA)

## non-text-contrast

**Buttons you can see.** A button's background is under 3:1 against what's behind it and it has no border that is, so its edge disappears.

- **Why:** A pale button on a white card looks like plain text to someone with low vision: they don't know there's something to press.
- **Fix:** Darken the button's background, or give it a border at least 3:1 against the background.
- **WCAG 2.2:** 1.4.11 Non-text contrast (AA)

## link-distinct

**Links that don't rely on colour.** A link inside a sentence isn't underlined and its colour is under 3:1 against the text around it.

- **Why:** Someone who can't tell the link's colour from the text's (one man in twelve has a colour vision deficiency) can't find it.
- **Fix:** Underline links in running text (the default), or make the colour difference at least 3:1.
- **WCAG 2.2:** 1.4.1 Use of colour (A)

## headings

**Headings to navigate by.** The email has no heading, or its first heading isn't level 1.

- **Why:** Screen reader users jump from heading to heading to find what they need. With none, they have to listen to everything in order.
- **Fix:** Start with one level-1 Heading saying what the email is about, and use Headings for its sections.
- **WCAG 2.2:** 1.3.1 Info and relationships; 2.4.6 Headings and labels (AA)

## table-header

**Tables with headers.** A data table has no header row, so a screen reader can't say which column a value is in.

- **Why:** "12, 2, 24" means nothing read aloud. "Price 12, Quantity 2, Total 24" does, and that's what a header row gives.
- **Fix:** Make the first TableRow a header (`<TableRow header>`): Hyper Elements writes it as <th scope="col">.
- **WCAG 2.2:** 1.3.1 Info and relationships (A)

## reading-order

**Reading order that matches the layout.** A Row's direction is reversed to swap its columns on screen, so a screen reader reads them in the other order.

- **Why:** The dir="rtl" trick puts the image first on desktop and the text first in the code: the screen reader and the phone get a different email from the desktop.
- **Fix:** Put the columns in the order they should be read and drop the Row's dir; Hyper Elements stacks them in that order on phones.
- **WCAG 2.2:** 1.3.2 Meaningful sequence (A)

## code-readout

**Codes read as digits.** Six or more digits in a row: a screen reader reads 482913 as "four hundred eighty-two thousand, nine hundred thirteen".

- **Why:** Sign-in codes, tracking and order numbers are typed in elsewhere. Read as one big number, they have to be listened to again and again.
- **Fix:** Group the digits with spaces (482 913) so they're read one by one, and the reader can keep their place.
- **WCAG 2.2:** 1.3.1 Info and relationships (Best practice)

## emoji

**No emoji in headings, buttons and links.** An emoji in a heading, button or link: a screen reader reads its full name (🎉 "party popper") as part of it.

- **Why:** "Party popper, party popper, your order is confirmed, party popper" is what a screen reader user hears, and it's in every list of headings and links.
- **Fix:** Leave emoji out of headings, buttons and links, and use few in text.
- **WCAG 2.2:** 1.1.1 Non-text content; 2.4.6 Headings and labels (Best practice)

## all-caps

**No long text in capitals.** A long run of text is in capitals, which is slower to read, and some screen readers spell words in capitals letter by letter.

- **Why:** Words in capitals lose their shape, which readers with dyslexia and low vision rely on.
- **Fix:** Write it in sentence case, and use weight or size for emphasis.
- **WCAG 2.2:** 1.4.8 (Best practice)

## justified

**No justified text.** Text is justified, which leaves uneven gaps between words.

- **Why:** The "rivers" of white space in justified text make lines hard to follow, above all for readers with dyslexia.
- **Fix:** Align text to the start (left, or right in a right-to-left language).
- **WCAG 2.2:** 1.4.8 (AAA)

## line-height

**Room between lines.** A paragraph's line height is under 1.4 times its font size.

- **Why:** Cramped lines are hard to track from the end of one to the start of the next, for readers with low vision or dyslexia.
- **Fix:** Set lineHeight to 1.5 for body text.
- **WCAG 2.2:** 1.4.8; 1.4.12 Text spacing (AAA)

## centered-text

**No long centred paragraphs.** A long paragraph is centred, so every line starts in a different place.

- **Why:** With a magnifier, a reader has to hunt for the start of each centred line.
- **Fix:** Centre a short line, if anything; align paragraphs to the start.
- **WCAG 2.2:** 1.4.8 (Best practice)

## layout-table

**Layout tables hidden from screen readers.** A table in the HTML has no header cells and no role="presentation", so a screen reader announces a layout as a data table.

- **Why:** "Table, 3 columns, 1 row" before every section is noise a screen reader user has to sit through.
- **Fix:** Use Rows and Columns (Hyper Elements marks their tables role="presentation"), or add the role to the table in an Html block.
- **WCAG 2.2:** 1.3.1 Info and relationships (A)
