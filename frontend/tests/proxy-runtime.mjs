import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createServer } from "node:http";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const standalone = join(root, ".next", "standalone");
assert.ok(existsSync(join(standalone, "server.js")), "Build the standalone frontend first.");
const secret = "test-only-proxy-ip-secret-at-least-32-characters";

async function listen(server) {
  await new Promise(resolveReady => server.listen(0, "127.0.0.1", resolveReady));
  return server.address().port;
}

function backend(label) {
  return createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    response.statusCode = request.method === "POST" ? 201 : 200;
    response.setHeader("Content-Type", "application/json");
    response.setHeader("Set-Cookie", "rk_access=test; HttpOnly; Path=/");
    response.end(JSON.stringify({
      label,
      method: request.method,
      url: request.url,
      body: Buffer.concat(chunks).toString("base64"),
      contentType: request.headers["content-type"],
      signedClientIp: Boolean(request.headers["x-rk-client-ip-signature"]),
    }));
  });
}

async function freePort() {
  const server = createServer();
  const port = await listen(server);
  await new Promise(resolveClosed => server.close(resolveClosed));
  return port;
}

async function startFrontend(upstream) {
  const port = await freePort();
  const child = spawn(process.execPath, ["server.js"], {
    cwd: standalone,
    env: { ...process.env, NODE_ENV: "production", HOSTNAME: "127.0.0.1", PORT: String(port),
      API_INTERNAL_BASE_URL: upstream, API_PROXY_IP_SECRET: secret, SITE_URL: `http://127.0.0.1:${port}` },
    stdio: "ignore",
  });
  const url = `http://127.0.0.1:${port}`;
  for (let attempt = 0; attempt < 80; attempt++) {
    if (child.exitCode !== null) throw new Error("Standalone frontend exited before startup.");
    try {
      const response = await fetch(`${url}/api/v1/echo`);
      if (response.ok) return { child, url };
    } catch { /* Wait for startup. */ }
    await new Promise(resolveWait => setTimeout(resolveWait, 250));
  }
  child.kill();
  throw new Error("Standalone frontend did not start.");
}

async function stopFrontend(child) {
  if (child.exitCode !== null) return;
  child.kill();
  await Promise.race([
    new Promise(resolveExit => child.once("exit", resolveExit)),
    new Promise(resolveWait => setTimeout(resolveWait, 3000)),
  ]);
}

const firstBackend = backend("first");
const secondBackend = backend("second");
let firstFrontend;
let secondFrontend;
try {
  const firstPort = await listen(firstBackend);
  const secondPort = await listen(secondBackend);
  firstFrontend = await startFrontend(`http://127.0.0.1:${firstPort}`);
  const first = await fetch(`${firstFrontend.url}/api/v1/echo?number=1`);
  assert.equal(first.status, 200);
  assert.equal(first.headers.get("cache-control"), "no-store");
  assert.match(first.headers.get("set-cookie") || "", /rk_access=test/);
  const firstBody = await first.json();
  assert.equal(firstBody.label, "first");
  assert.equal(firstBody.url, "/api/v1/echo?number=1");
  assert.equal(firstBody.signedClientIp, true);

  const binary = Buffer.from([0, 1, 2, 255]);
  const posted = await fetch(`${firstFrontend.url}/api/v1/upload?kind=binary`, {
    method: "POST", headers: { "Content-Type": "application/octet-stream", Cookie: "rk_refresh=example" }, body: binary,
  });
  assert.equal(posted.status, 201);
  const postedBody = await posted.json();
  assert.equal(postedBody.url, "/api/v1/upload?kind=binary");
  assert.equal(postedBody.body, binary.toString("base64"));
  assert.equal(postedBody.contentType, "application/octet-stream");

  await stopFrontend(firstFrontend.child);
  firstFrontend = undefined;
  secondFrontend = await startFrontend(`http://127.0.0.1:${secondPort}`);
  const second = await fetch(`${secondFrontend.url}/api/v1/echo`);
  assert.equal((await second.json()).label, "second", "runtime backend URL changed without rebuilding");
  console.log("Runtime proxy, cookies, query, binary body, and runtime backend URL: passed");
} finally {
  if (firstFrontend) await stopFrontend(firstFrontend.child);
  if (secondFrontend) await stopFrontend(secondFrontend.child);
  await Promise.all([firstBackend, secondBackend].map(server => new Promise(resolveClosed => server.close(resolveClosed))));
}
