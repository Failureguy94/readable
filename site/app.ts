/** The site: pick an email, hear it read, see it as others do, check your own. Everything runs in the browser. */
import { readAloud, Reader, type Line } from "./sr";
import { auditDom, type DomFinding } from "./dom-audit";

interface OwnRule { id: string; title: string; wcag: string[]; level: string; summary: string; fix: string; why: string }
interface LintRule { id: string; summary: string; fix: string }
interface Criterion { id: string; name: string; level: string; rules: string[]; review?: string; output?: string; design?: string }
interface TemplateData {
  slug: string;
  label: string;
  description: string;
  locales: string[];
  ruleCount: number;
  rules: { rule: string; source: string; status: string }[];
  criteria: (Criterion & { status: "pass" | "review" | "fail" })[];
  before: { rule: string; severity: string; message: string; fix?: string }[];
  clients: { label: string; file: string }[];
}
interface Data { templates: TemplateData[]; own: OwnRule[]; lint: LintRule[]; criteria: Criterion[]; languages: Record<string, string> }

const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector(s) as T;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

const data: Data = await fetch("/data.json")
  .then((r) => {
    if (!r.ok) throw new Error(`data.json: ${r.status}`);
    return r.json();
  })
  .catch((e: unknown) => {
    // Say so on the page, instead of leaving an empty demo.
    const stage = document.querySelector("#main .wrap");
    stage?.insertAdjacentHTML("beforeend", `<p class="lang-note" role="alert">The demo couldn't load its emails (${String(e)}). Reload the page to try again.</p>`);
    throw e;
  });
const OWN = new Map(data.own.map((r) => [r.id, r]));
const LINT = new Map(data.lint.map((r) => [r.id, r]));
const wcagOf = (rule: string) => data.criteria.filter((c) => c.rules.includes(rule)).map((c) => c.id);
const LINT_TITLES: Record<string, string> = {
  "image-alt": "Image links with nothing to read", "alt-text": "Alt text that says something", "link-text": "Links that say where they go",
  "link-empty": "Links with no words", "link-target": "Links that go somewhere", "heading-order": "Heading levels in order",
  "heading-one": "One main heading", "heading-empty": "Headings with words", contrast: "Text contrast", "text-size": "Text size",
  lang: "The email's language", dir: "Reading direction", title: "A title", "preview-text": "Preview text", "merge-syntax": "Raw merge tags",
  unsubscribe: "Unsubscribe link", "video-title": "Video titles", "role-button": "Links announced as buttons",
};
const titleOf = (rule: string) => OWN.get(rule)?.title ?? LINT_TITLES[rule] ?? rule;
const sourceOf = (rule: string) => (OWN.has(rule) ? "Readable" : LINT.has(rule) || LINT_TITLES[rule] ? "lint" : "");

type Version = "before" | "after";
const state = {
  slug: data.templates[0]!.slug as string,
  version: "after" as Version,
  locale: "en",
  sim: "none",
  rotor: "all",
  yours: "",
};

// ---------------------------------------------------------------------------------------------------------------
// URL state, so a view can be shared

function readHash() {
  const h = new URLSearchParams(location.hash.slice(1));
  const slug = h.get("email");
  if (slug && (slug === "yours" || data.templates.some((t) => t.slug === slug))) state.slug = slug;
  if (h.get("v") === "before" || h.get("v") === "after") state.version = h.get("v") as Version;
  if (h.get("l") && data.languages[h.get("l")!]) state.locale = h.get("l")!;
  if (h.get("see")) state.sim = h.get("see")!;
}
function writeHash() {
  const h = new URLSearchParams({ email: state.slug });
  if (state.slug !== "yours") {
    h.set("v", state.version);
    if (state.version === "after" && state.locale !== "en") h.set("l", state.locale);
  }
  if (state.sim !== "none") h.set("see", state.sim);
  history.replaceState(null, "", "#" + h.toString());
}

// ---------------------------------------------------------------------------------------------------------------
// Tabs that work from the keyboard (arrow keys, Home, End)

function tablist(list: HTMLElement, onSelect: (tab: HTMLElement) => void) {
  const tabs = () => [...list.querySelectorAll<HTMLElement>("[role=tab]")];
  const select = (tab: HTMLElement, focus = false) => {
    for (const t of tabs()) {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
    }
    if (focus) tab.focus();
    onSelect(tab);
  };
  list.addEventListener("click", (e) => {
    const t = (e.target as HTMLElement).closest<HTMLElement>("[role=tab]");
    if (t) select(t);
  });
  list.addEventListener("keydown", (e) => {
    const all = tabs();
    const i = all.indexOf(document.activeElement as HTMLElement);
    if (i < 0) return;
    const next = e.key === "ArrowRight" ? all[(i + 1) % all.length] : e.key === "ArrowLeft" ? all[(i - 1 + all.length) % all.length] : e.key === "Home" ? all[0] : e.key === "End" ? all[all.length - 1] : null;
    if (next) {
      e.preventDefault();
      select(next, true);
    }
  });
  return select;
}

// The email picker
const picker = $("#picker");
picker.innerHTML =
  data.templates.map((t) => `<button role="tab" data-slug="${t.slug}" aria-controls="main-stage">${esc(t.label)}</button>`).join("") +
  `<button role="tab" data-slug="yours" aria-controls="main-stage">Your own email</button>`;
const selectEmail = tablist(picker, (tab) => {
  state.slug = tab.dataset.slug!;
  load();
});

// The panel's tabs
const panelTabs = $(".ptabs");
const selectPanel = tablist(panelTabs, (tab) => {
  for (const t of panelTabs.querySelectorAll<HTMLElement>("[role=tab]")) $("#" + t.getAttribute("aria-controls")).hidden = t !== tab;
});

// Version, language, simulation
const seg = [...document.querySelectorAll<HTMLButtonElement>(".seg button")];
seg.forEach((b) =>
  b.addEventListener("click", () => {
    state.version = b.dataset.v as Version;
    load();
  }),
);
const localeSel = $<HTMLSelectElement>("#locale");
localeSel.innerHTML = Object.entries(data.languages).map(([k, v]) => `<option value="${k}">${esc(v)}</option>`).join("");
localeSel.addEventListener("change", () => {
  state.locale = localeSel.value;
  load();
});
const simSel = $<HTMLSelectElement>("#sim");
simSel.addEventListener("change", () => {
  state.sim = simSel.value;
  applySim();
  writeHash();
});

// ---------------------------------------------------------------------------------------------------------------
// The frame

const frame = $<HTMLIFrameElement>("#frame");
const box = $("#frame-box");
let lines: Line[] = [];
let reader: Reader | null = null;
let domFindings: DomFinding[] = [];

const SIMS: Record<string, { filter?: string; note: string }> = {
  none: { note: "" },
  phone: { note: "320 px wide, the narrowest phone WCAG's reflow criterion (1.4.10) asks a layout to work at without scrolling sideways." },
  zoom: { note: "Zoomed to 200%, as someone with low vision sets their mail app. WCAG 1.4.4 asks that nothing is lost." },
  protanopia: { filter: "url(#protanopia)", note: "About 1 in 100 men see no red. Can you still tell the links and the button from the text?" },
  deuteranopia: { filter: "url(#deuteranopia)", note: "The most common deficiency: about 1 in 20 men see green weakly or not at all. Progress shown only in green disappears." },
  tritanopia: { filter: "url(#tritanopia)", note: "Rare: no blue cones. Blue and yellow, and green and grey, look alike." },
  grey: { filter: "grayscale(1)", note: "No colour at all: what's left is contrast and words. Nothing should depend on colour alone (WCAG 1.4.1)." },
  blur: { filter: "blur(1.6px)", note: "Low vision, roughly. Faint grey small print disappears first; big, high-contrast text survives." },
};

function applySim() {
  const s = SIMS[state.sim] ?? SIMS.none!;
  frame.style.filter = s.filter ?? "";
  box.classList.toggle("phone", state.sim === "phone");
  box.classList.toggle("zoom", state.sim === "zoom");
  const doc = frame.contentDocument;
  if (doc?.documentElement) (doc.documentElement.style as CSSStyleDeclaration & { zoom: string }).zoom = state.sim === "zoom" ? "2" : "";
  const note = $("#sim-note");
  note.hidden = !s.note;
  note.textContent = s.note;
  simSel.value = state.sim;
}

const current = () => data.templates.find((t) => t.slug === state.slug);
let plainFor = "";

function load() {
  reader?.stop();
  writeHash();
  const t = current();
  const yours = state.slug === "yours";
  $("#yours").hidden = !yours;
  $(".seg").parentElement!.hidden = yours;
  localeSel.parentElement!.hidden = yours || state.version === "before";
  for (const b of seg) b.setAttribute("aria-pressed", String(b.dataset.v === state.version));
  localeSel.value = state.locale;
  for (const tab of picker.querySelectorAll<HTMLElement>("[role=tab]")) {
    const on = tab.dataset.slug === state.slug;
    tab.setAttribute("aria-selected", String(on));
    tab.tabIndex = on ? 0 : -1;
  }

  if (yours) {
    $("#frame-label").textContent = "Your email";
    if (state.yours) frame.srcdoc = state.yours;
    else {
      frame.removeAttribute("src");
      frame.srcdoc = `<body style="font:16px system-ui;color:#4b5563;padding:24px">Paste an email's HTML above and press <b>Check it</b>.</body>`;
    }
  } else if (t) {
    frame.removeAttribute("srcdoc");
    const file = state.version === "before" ? "before" : state.locale;
    frame.src = `/emails/${t.slug}/${file}.html`;
    $("#frame-label").textContent = state.version === "before" ? `${t.label}, as usually built` : `${t.label}, ${data.languages[state.locale]}`;
    const url = `/emails/${t.slug}/${file}.txt`;
    plainFor = url;
    // Only the text of the email still shown: a slow answer for one picked earlier is dropped.
    fetch(url)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status)))))
      .then((txt) => plainFor === url && ($("#plain").textContent = txt))
      .catch(() => plainFor === url && ($("#plain").textContent = "The plain-text part couldn't be loaded."));
  }
  renderClientLinks();
}

frame.addEventListener("load", () => {
  const doc = frame.contentDocument;
  if (!doc?.body) return;
  const style = doc.createElement("style");
  style.textContent = `.__sr{outline:3px solid #f5b400 !important;outline-offset:2px;background-color:rgba(255,214,0,.28) !important;border-radius:3px}
  .__find{outline:3px dashed #a4161a !important;outline-offset:3px}`;
  doc.head?.appendChild(style);
  applySim();
  lines = readAloud(doc);
  if (state.slug === "yours") {
    domFindings = state.yours ? auditDom(doc, state.yours) : [];
    $("#plain").textContent = state.yours ? textOf(doc) : "";
  }
  renderTranscript();
  renderFindings();
  renderWcag();
  renderVerdict();
  const hasLang = !!doc.documentElement.getAttribute("lang") || !!doc.querySelector("[lang]");
  const note = $("#lang-note");
  note.hidden = hasLang || !state.yours && state.slug === "yours";
  note.textContent = "This email doesn't say its language, so the screen reader reads it with its default voice, whatever language it's in. Readable's emails each say theirs.";
});

const textOf = (doc: Document) => (doc.body.innerText || "").replace(/\n{3,}/g, "\n\n").trim();

// ---------------------------------------------------------------------------------------------------------------
// The screen reader

const transcript = $("#transcript");
function renderTranscript() {
  const shown = lines.map((l, i) => ({ l, i })).filter(({ l }) => state.rotor === "all" || (state.rotor === "problem" ? !!l.problem : l.kind === state.rotor));
  transcript.innerHTML = shown
    .map(({ l, i }) => `<li data-i="${i}"><button type="button" title="Read from here"><span class="k">${l.kind === "cell" ? "cell" : l.kind}</span><span>${esc(l.say)}${l.problem ? `<span class="p">${esc(l.problem)}</span>` : ""}</span></button></li>`)
    .join("");
  const count = (k: string) => lines.filter((l) => l.kind === k).length;
  const problems = lines.filter((l) => l.problem).length;
  $("#rotor-note").textContent =
    state.rotor === "heading" ? (count("heading") ? `Screen reader users press H to jump between these ${count("heading")} headings.` : "No headings: there's nothing to jump to. Everything has to be heard in order.")
    : state.rotor === "link" ? `The links list, as a screen reader shows it: each link by its words alone, out of context.`
    : state.rotor === "problem" ? (problems ? `${problems} things a listener stumbles on.` : "Nothing a listener stumbles on.")
    : `${lines.length} things to listen to, ${count("heading")} headings, ${count("link")} links.`;
  if (!shown.length) transcript.innerHTML = `<li><button type="button" disabled><span class="k">—</span><span>Nothing to show.</span></button></li>`;
}
transcript.addEventListener("click", (e) => {
  const li = (e.target as HTMLElement).closest<HTMLElement>("li[data-i]");
  if (!li) return;
  const i = +li.dataset.i!;
  if (Reader.available()) play(i);
  else mark(i);
});
for (const b of document.querySelectorAll<HTMLButtonElement>(".rotor button"))
  b.addEventListener("click", () => {
    state.rotor = b.dataset.r!;
    for (const x of document.querySelectorAll(".rotor button")) x.setAttribute("aria-pressed", String(x === b));
    renderTranscript();
  });

function mark(i: number) {
  const doc = frame.contentDocument;
  doc?.querySelectorAll(".__sr").forEach((e) => e.classList.remove("__sr"));
  transcript.querySelectorAll("li.now").forEach((e) => e.classList.remove("now"));
  const line = lines[i];
  if (!line) return;
  line.el.classList.add("__sr");
  line.el.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  const li = transcript.querySelector<HTMLElement>(`li[data-i="${i}"]`);
  if (li) {
    li.classList.add("now");
    li.scrollIntoView({ block: "nearest" });
  }
}

const playBtn = $<HTMLButtonElement>("#play");
const stopBtn = $<HTMLButtonElement>("#stop");
function play(from = 0) {
  reader?.stop();
  const doc = frame.contentDocument!;
  reader = new Reader(lines, doc.documentElement.getAttribute("lang") ? doc.documentElement.getAttribute("lang")! : "en");
  reader.rate = +$<HTMLSelectElement>("#rate").value;
  reader.onLine = mark;
  reader.onEnd = () => {
    playBtn.disabled = false;
    stopBtn.disabled = true;
  };
  playBtn.disabled = true;
  stopBtn.disabled = false;
  reader.play(from);
}
playBtn.addEventListener("click", () => play(0));
stopBtn.addEventListener("click", () => {
  reader?.stop();
  playBtn.disabled = false;
  stopBtn.disabled = true;
});
if (!Reader.available()) {
  playBtn.disabled = true;
  playBtn.textContent = "No speech in this browser";
}

// ---------------------------------------------------------------------------------------------------------------
// Findings, WCAG, verdict

function findingsNow(): { rule: string; severity: string; message: string; fix?: string; el?: Element }[] {
  if (state.slug === "yours") return domFindings;
  const t = current();
  if (!t) return [];
  return state.version === "before" ? t.before : [];
}

function renderFindings() {
  const p = $("#p-find");
  const t = current();
  if (state.slug !== "yours" && state.version === "after" && t) {
    const own = t.rules.filter((r) => OWN.has(r.rule));
    const rest = t.rules.filter((r) => !OWN.has(r.rule));
    p.innerHTML = `<p style="margin-top:0"><b>All ${t.ruleCount} required rules pass in ${t.locales.length} languages.</b> The template requires each one, so this email can't be sent if any of them fails.</p>
      <details class="rules-ok" open><summary>Readable's ${own.length} rules</summary><ul class="rule-grid">${own.map((r) => `<li>${esc(OWN.get(r.rule)!.title)}</li>`).join("")}</ul></details>
      <details class="rules-ok"><summary>Lint's and the template's ${rest.length}</summary><ul class="rule-grid">${rest.map((r) => `<li>${esc(r.rule)}</li>`).join("")}</ul></details>
      <p style="margin-bottom:0"><a href="/reports/${t.slug}.pdf">Download the conformance report (PDF)</a></p>`;
    return;
  }
  const f = findingsNow();
  if (state.slug === "yours" && !state.yours) {
    p.innerHTML = `<p class="muted" style="margin:0">Paste an email first.</p>`;
    return;
  }
  if (!f.length) {
    p.innerHTML = `<p style="margin:0"><b>No problems found by the automated checks.</b> Listen to it anyway: words, images and order still need a person.</p>`;
    return;
  }
  const order = (x: { severity: string }) => (x.severity === "warning" ? 0 : 1);
  p.innerHTML = `<p style="margin-top:0"><b>${f.length} problem${f.length === 1 ? "" : "s"}</b>${state.slug === "yours" ? ", found by lint's HTML checks and Readable's rules run on the page" : ", found by lint and Readable's plugin"}. ${state.slug === "yours" ? "" : "Hyper Elements calls this email valid: lint only warns. A Readable template requires every rule, so it would refuse this email."}</p>
  <ul class="findings">${[...f]
    .map((x, i) => ({ x, i }))
    .sort((a, b) => order(a.x) - order(b.x))
    .map(({ x, i }) => {
      const sc = OWN.get(x.rule)?.wcag ?? wcagOf(x.rule);
      return `<li class="${x.severity === "info" ? "info" : ""}"><span class="rule">${esc(titleOf(x.rule))}</span><span class="tag">${sourceOf(x.rule)}</span>${sc.length ? `<span class="tag">WCAG ${sc.join(", ")}</span>` : ""}<span class="tag">${x.severity === "info" ? "note" : "problem"}</span><br>${esc(x.message.replace(/ \(required by.*\)$/, ""))}${x.fix ? `<span class="fix">Fix: ${esc(x.fix)}</span>` : OWN.get(x.rule) ? `<span class="fix">Fix: ${esc(OWN.get(x.rule)!.fix)}</span>` : ""}${x.el ? `<br><button type="button" class="locate" data-f="${i}">Show me</button>` : ""}</li>`;
    })
    .join("")}</ul>`;
}
$("#p-find").addEventListener("click", (e) => {
  const b = (e.target as HTMLElement).closest<HTMLElement>("button.locate");
  if (!b) return;
  const f = domFindings[+b.dataset.f!];
  frame.contentDocument?.querySelectorAll(".__find").forEach((x) => x.classList.remove("__find"));
  if (f?.el) {
    f.el.classList.add("__find");
    f.el.scrollIntoView({ block: "center" });
  }
});

function renderWcag() {
  const p = $("#p-wcag");
  const t = current();
  let rows: { c: Criterion; status: "pass" | "review" | "fail" }[];
  if (state.slug !== "yours" && state.version === "after" && t) rows = t.criteria.map((c) => ({ c, status: c.status }));
  else {
    const found = new Set(findingsNow().map((f) => f.rule));
    rows = data.criteria.map((c) => ({ c, status: c.rules.some((r) => found.has(r)) ? "fail" : c.review || !c.rules.length ? "review" : "pass" }));
    if (state.slug === "yours" && !state.yours) {
      p.innerHTML = `<p class="muted" style="margin:0">Paste an email first.</p>`;
      return;
    }
  }
  const label = { pass: "Passes", review: "Person checks", fail: "Fails" };
  const fails = rows.filter((r) => r.status === "fail").length;
  p.innerHTML = `<p style="margin-top:0">${fails ? `<b>${fails} of ${rows.length} WCAG 2.2 criteria fail.</b>` : `<b>No WCAG 2.2 criterion fails.</b>`} Level A and AA, the ones that apply to an email.</p>
  <table class="crit"><thead><tr><th scope="col">Criterion</th><th scope="col">Result</th></tr></thead><tbody>${rows
    .map(({ c, status }) => `<tr><td><b>${c.id}</b> ${esc(c.name)} <span class="muted">(${c.level})</span>${status !== "pass" && c.review ? `<br><span class="muted" style="font-size:13.5px">${esc(c.review)}</span>` : ""}</td><td><span class="st ${status}">${label[status]}</span></td></tr>`)
    .join("")}</tbody></table>`;
}

function renderVerdict() {
  const v = $("#verdict");
  const t = current();
  if (state.slug === "yours") {
    v.className = "verdict " + (domFindings.some((f) => f.severity === "warning") ? "bad" : "good");
    v.textContent = !state.yours ? "Nothing checked yet" : domFindings.length ? `${domFindings.length} problem${domFindings.length === 1 ? "" : "s"} found` : "No problems found";
  } else if (state.version === "before") {
    v.className = "verdict bad";
    v.textContent = `Typical: ${t!.before.length} problems`;
  } else {
    v.className = "verdict good";
    v.textContent = `Readable: all ${t!.ruleCount} rules pass`;
  }
}

function renderClientLinks() {
  const el = $("#client-links");
  const t = current();
  if (!t || state.slug === "yours" || state.version === "before") {
    el.innerHTML = "";
    return;
  }
  el.innerHTML = `<span class="muted">As Hyper Elements' email client emulator draws it:</span> ${t.clients.map((c) => `<a href="/clients/${t.slug}/${c.file}" target="_blank" rel="noopener">${esc(c.label)}<span class="sr-only"> (opens in a new tab)</span></a>`).join(" · ")}`;
}

// ---------------------------------------------------------------------------------------------------------------
// Your own email

const toast = (msg: string) => {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2200);
};
function checkYours(html: string) {
  state.yours = html;
  state.slug = "yours";
  load();
  selectPanel($("#t-find"));
}
$("#check-html").addEventListener("click", () => {
  const html = $<HTMLTextAreaElement>("#html-in").value.trim();
  if (!html) return toast("Paste some HTML first");
  checkYours(html);
});
$<HTMLInputElement>("#html-file").addEventListener("change", async (e) => {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (!f) return;
  const html = await f.text();
  $<HTMLTextAreaElement>("#html-in").value = html;
  checkYours(html);
});
$("#load-sample").addEventListener("click", async () => {
  const html = await (await fetch(`/emails/${data.templates[0]!.slug}/before.html`)).text();
  $<HTMLTextAreaElement>("#html-in").value = html;
  checkYours(html);
});
document.querySelectorAll<HTMLElement>("[data-goto=yours]").forEach((a) =>
  a.addEventListener("click", () => {
    state.slug = "yours";
    load();
    setTimeout(() => $("#html-in").focus(), 300);
  }),
);

readHash();
applySim();
load();
void selectEmail;
