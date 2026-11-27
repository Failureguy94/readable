/**
 * `npm run serve`: the built site (site/dist) on http://localhost:$PORT, served the way Vercel serves it, so what you
 * try locally is what's deployed. It binds its own port (twelve-factor VII), logs each request to stdout (XI), and
 * stops cleanly on Ctrl-C or SIGTERM (IX). Run `npm run site` first.
 */
import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";

const root = resolve("site/dist");
const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error(`PORT must be a port number, not "${process.env.PORT}"`);

const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".pdf": "application/pdf",
};

// The headers vercel.json gives each path, given here too: the CSP is tried locally before it's deployed.
const vercel = JSON.parse(await readFile("vercel.json", "utf8")) as { headers?: { source: string; headers: { key: string; value: string }[] }[] };
const rules = (vercel.headers ?? []).map((h) => ({ match: new RegExp(`^${h.source}$`), headers: h.headers }));
const headersFor = (path: string) => Object.fromEntries(rules.filter((r) => r.match.test(path)).flatMap((r) => r.headers.map((h) => [h.key.toLowerCase(), h.value])));

await stat(join(root, "index.html")).catch(() => {
  throw new Error("site/dist/index.html is missing: run npm run site first");
});

const server = createServer(async (req, res) => {
  const started = Date.now();
  const raw = new URL(req.url ?? "/", "http://localhost").pathname;
  let path = raw;
  let status = 200;
  try {
    path = decodeURIComponent(raw);
    // Inside site/dist only: no "..", however it's written.
    let file = normalize(join(root, path));
    if (file !== root && !file.startsWith(root + sep)) throw new Error("outside");
    if ((await stat(file)).isDirectory()) file = join(file, "index.html");
    await stat(file);
    res.writeHead(200, { ...headersFor(path), "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
    createReadStream(file).pipe(res);
  } catch {
    status = 404;
    res.writeHead(404, { ...headersFor(path), "content-type": "text/plain; charset=utf-8" }).end("Not found");
  }
  res.on("finish", () => console.log(`${req.method} ${path} ${status} ${Date.now() - started}ms`));
});

server.listen(port, () => {
  const address = server.address();
  console.log(`Readable on http://localhost:${typeof address === "object" && address ? address.port : port}`);
});

for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () => {
    server.close(() => process.exit(0));
    server.closeAllConnections();
  });
