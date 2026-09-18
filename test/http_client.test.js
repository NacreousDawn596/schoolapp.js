/**
 * Universal HTTP client test suite.
 *
 * Spins up a local Node HTTP server and exercises the fetch-based HTTPClient
 * (GET, POST, cookies, redirects, timeout, network checker, parsing, login
 * detection) end to end.
 */

const http = require("node:http");
const assert = require("node:assert");
const { HTTPClient, CookieJar, setNetworkChecker } = require("../index.js");

/* -------------------------------------------------------------------------- */
/*                             TEST HARNESS                                   */
/* -------------------------------------------------------------------------- */

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

async function run() {
  let passed = 0;
  let failed = 0;

  for (const t of tests) {
    try {
      await t.fn();
      passed++;
      console.log(`   ✅ ${t.name}`);
    } catch (e) {
      failed++;
      console.error(`   ❌ ${t.name}`);
      console.error(`      ${e && e.message ? e.message : e}`);
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log(`   Passed: ${passed} / ${tests.length}`);
  if (failed > 0) {
    console.error(`   Failed: ${failed}`);
    process.exit(1);
  }
  console.log("   ALL HTTP CLIENT TESTS PASSED");
}

/* -------------------------------------------------------------------------- */
/*                                TEST SERVER                                 */
/* -------------------------------------------------------------------------- */

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}

async function startServer() {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    const body = req.method === "POST" ? await readBody(req) : "";

    const send = (status, bodyStr, headers = {}) => {
      res.writeHead(status, headers);
      res.end(bodyStr);
    };

    switch (url.pathname) {
      case "/test":
        return send(200, "hello");

      case "/json":
        return send(200, JSON.stringify({ a: 1, b: "two" }), {
          "Content-Type": "application/json",
        });

      case "/html":
        return send(200, "<html><body><h1>Welcome</h1></body></html>", {
          "Content-Type": "text/html",
        });

      case "/echo-cookie":
        return send(200, req.headers.cookie || "");

      case "/set-cookie":
        return send(200, "ok", { "Set-Cookie": "session=abc" });

      case "/set-cookies":
        res.writeHead(200, {
          "Set-Cookie": ["session=abc", "user=123"],
        });
        return res.end("ok");

      case "/set-cookie-update":
        return send(200, "ok", { "Set-Cookie": "session=xyz" });

      case "/set-cookie-equals":
        return send(200, "ok", { "Set-Cookie": "token=a=b=c" });

      case "/delete-cookie":
        return send(200, "ok", {
          "Set-Cookie": "session=deleted; Max-Age=0",
        });

      case "/redirect-relative":
        return send(302, "redirect", { Location: "/dashboard" });

      case "/redirect-absolute": {
        const target = `http://127.0.0.1:${server.address().port}/dashboard`;
        return send(302, "redirect", { Location: target });
      }

      case "/dashboard":
        return send(200, "dashboard");

      case "/redirect-post":
        return send(302, "redirect", { Location: "/dashboard-method" });

      case "/dashboard-method":
        return send(200, `method=${req.method};body=${body}`);

      case "/redirect-307":
        return send(307, "redirect", { Location: "/login2" });

      case "/login2":
        return send(200, `method=${req.method};body=${body}`);

      case "/echo-post":
        return send(200, `ct=${req.headers["content-type"]};body=${body}`);

      case "/login":
        return send(200, '<html><div class="login-box">Please sign in</div></html>', {
          "Content-Type": "text/html",
        });

      case "/fake-login-box":
        return send(200, '<html><div class="login-box">Please sign in</div></html>', {
          "Content-Type": "text/html",
        });

      case "/slow":
        setTimeout(() => send(200, "late"), 500);
        return;

      default:
        return send(404, "not found");
    }
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return server;
}

async function startRedirectLoopServer() {
  const server = http.createServer((req, res) => {
    res.writeHead(302, { Location: "/loop" });
    res.end();
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return server;
}

/* -------------------------------------------------------------------------- */
/*                                  TESTS                                     */
/* -------------------------------------------------------------------------- */

let server;
let baseUrl;

test("GET /test returns 200 and text content", async () => {
  const client = new HTTPClient(baseUrl);
  const res = await client.get("/test");
  assert.strictEqual(res.code, 200);
  assert.strictEqual(res.content, "hello");
  assert.strictEqual(res.url, `${baseUrl}/test`);
});

test("POST /login sends application/x-www-form-urlencoded", async () => {
  const client = new HTTPClient(baseUrl);
  const res = await client.post("/echo-post", { email: "a@b.c", password: "p" });
  assert.strictEqual(res.code, 200);
  assert.ok(res.content.includes("application/x-www-form-urlencoded"));
  assert.ok(res.content.includes("email=a%40b.c"));
});

test("CookieJar preserves a single cookie across requests", async () => {
  const client = new HTTPClient(baseUrl);
  await client.get("/set-cookie");
  const res = await client.get("/echo-cookie");
  assert.strictEqual(res.content, "session=abc");
});

test("CookieJar preserves multiple cookies", async () => {
  const client = new HTTPClient(baseUrl);
  await client.get("/set-cookies");
  const res = await client.get("/echo-cookie");
  assert.strictEqual(res.content, "session=abc; user=123");
});

test("CookieJar updates an existing cookie", async () => {
  const client = new HTTPClient(baseUrl);
  await client.get("/set-cookie");
  await client.get("/set-cookie-update");
  const res = await client.get("/echo-cookie");
  assert.strictEqual(res.content, "session=xyz");
});

test("CookieJar removes a cookie on Max-Age=0", async () => {
  const client = new HTTPClient(baseUrl);
  await client.get("/set-cookie");
  await client.get("/delete-cookie");
  const res = await client.get("/echo-cookie");
  assert.strictEqual(res.content, "");
});

test("CookieJar handles values containing '='", async () => {
  const client = new HTTPClient(baseUrl);
  await client.get("/set-cookie-equals");
  const res = await client.get("/echo-cookie");
  assert.strictEqual(res.content, "token=a=b=c");
});

test("CookieJar does not leak cookies to another origin", async () => {
  const jar = new CookieJar();
  await jar.set("http://one.example.com/x", "session=abc");
  const cookies = await jar.get("http://two.example.com/x");
  assert.strictEqual(cookies, "");
});

test("Relative redirect resolves correctly", async () => {
  const client = new HTTPClient(baseUrl);
  const res = await client.get("/redirect-relative");
  assert.strictEqual(res.code, 200);
  assert.strictEqual(res.content, "dashboard");
  assert.strictEqual(res.url, `${baseUrl}/dashboard`);
});

test("Absolute redirect resolves correctly", async () => {
  const client = new HTTPClient(baseUrl);
  const res = await client.get("/redirect-absolute");
  assert.strictEqual(res.code, 200);
  assert.strictEqual(res.content, "dashboard");
  assert.strictEqual(res.url, `http://127.0.0.1:${server.address().port}/dashboard`);
});

test("POST → GET on 302 redirect drops the body", async () => {
  const client = new HTTPClient(baseUrl);
  const res = await client.post("/redirect-post", { email: "a@b.c" });
  assert.strictEqual(res.code, 200);
  assert.strictEqual(res.content, "method=GET;body=");
});

test("307 redirect preserves POST method and body", async () => {
  const client = new HTTPClient(baseUrl);
  const res = await client.post("/redirect-307", { email: "a@b.c" });
  assert.strictEqual(res.code, 200);
  assert.strictEqual(res.content, "method=POST;body=email=a%40b.c");
});

test("Timeout aborts a slow request", async () => {
  const client = new HTTPClient(baseUrl);
  client.timeout = 100;
  const res = await client.get("/slow");
  assert.strictEqual(res.code, null);
  assert.strictEqual(res.content, null);
});

test("Network checker blocks the request before fetch", async () => {
  setNetworkChecker(() => false);
  const client = new HTTPClient(baseUrl);
  const res = await client.get("/test");
  setNetworkChecker(null);
  assert.strictEqual(res.code, null);
  assert.strictEqual(res.content, null);
});

test("JSON content is parsed into an object", async () => {
  const client = new HTTPClient(baseUrl);
  const res = await client.get("/json");
  assert.deepStrictEqual(res.content, { a: 1, b: "two" });
});

test("HTML content is returned as a string", async () => {
  const client = new HTTPClient(baseUrl);
  const res = await client.get("/html");
  assert.strictEqual(typeof res.content, "string");
  assert.ok(res.content.includes("<h1>Welcome</h1>"));
});

test("Login detection triggers onUnauthorized", async () => {
  let called = false;
  const client = new HTTPClient(baseUrl);
  client.setUnauthorizedHandler(() => {
    called = true;
  });
  await client.get("/fake-login-box");
  assert.strictEqual(called, true);
});

test("Login detection is skipped for /login URLs", async () => {
  let called = false;
  const client = new HTTPClient(baseUrl);
  client.setUnauthorizedHandler(() => {
    called = true;
  });
  await client.get("/login");
  assert.strictEqual(called, false);
});

test("_request throws Too many redirects", async () => {
  const loop = await startRedirectLoopServer();
  const client = new HTTPClient(`http://127.0.0.1:${loop.address().port}`);
  try {
    await assert.rejects(client._request("GET", "/loop"), /Too many redirects/);
  } finally {
    loop.close();
  }
});

test("_request throws Network not ready when checker fails", async () => {
  setNetworkChecker(() => false);
  const client = new HTTPClient(baseUrl);
  try {
    await assert.rejects(client._request("GET", "/test"), /Network not ready/);
  } finally {
    setNetworkChecker(null);
  }
});

/* -------------------------------------------------------------------------- */
/*                                   MAIN                                     */
/* -------------------------------------------------------------------------- */

(async () => {
  console.log("🧪 Universal HTTP Client Test Suite\n");
  console.log("=".repeat(50));

  server = await startServer();
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  await run();

  server.close();
})();
