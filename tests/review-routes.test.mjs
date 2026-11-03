import assert from "node:assert/strict";
import worker from "../worker.js";

const calls = [];
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init = {}) => {
  const href = String(url);
  const bodyText = typeof init.body === "string" ? init.body : "";
  calls.push({ href, method: init.method || "GET", bodyText, headers: init.headers || {} });
  if (href.includes("supabase.co")) {
    return new Response(JSON.stringify([{ id: "lead-1" }]), { status: 201, headers: { "Content-Type": "application/json" } });
  }
  if (href.endsWith("/api/website-lead-intake")) {
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  }
  if (href.includes("not-json.example")) {
    return new Response("<!doctype html><html></html>", { status: 200, headers: { "Content-Type": "text/html" } });
  }
  if (href.endsWith("/api/website-review")) {
    return new Response(JSON.stringify({ ok: true, id: "rev-1" }), { status: 200, headers: { "Content-Type": "application/json" } });
  }
  if (href.endsWith("/api/public/reviews")) {
    return new Response(JSON.stringify({
      reviews: [
        { display_name: "Jane <C>", rating: 5, text: "Wonderful <script>alert(1)</script> help.", date: "2026-11-01" },
        { name: "Bad", rating: 9, text: "nope", date: "2026-11-01" },
        { display_name: "Sam", rating: 4, review: "Clear and honest.", created_at: "2026-10-02" }
      ]
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  }
  return new Response("missing", { status: 404 });
};

const baseEnv = {
  ASSETS: { async fetch() { return new Response("ok", { status: 200, headers: { "Content-Type": "text/html" } }); } },
  SUPABASE_SERVICE_ROLE_KEY: "test-key",
  BROKERAGE_OS_BASE_URL: "https://brokerage-preview.example/os",
  BROKERAGE_OS_WEBSITE_LEADS_ENABLED: "true",
  ADMIN_HUB_PASSWORD: "secret"
};

function post(path, body, { origin = "https://preview.example", ip = "203.0.113.10", extra = {} } = {}) {
  return new Request("https://preview.example" + path, {
    method: "POST",
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      "CF-Connecting-IP": ip,
      ...extra
    },
    body: JSON.stringify(body)
  });
}

const review = {
  name: "Jane Client",
  email: "jane@example.com",
  rating: 5,
  text: "Sal guided us from offer to closing.",
  property_or_service: "Sold our Brentwood home",
  consent: true,
  website: ""
};

async function main() {
  let res = await worker.fetch(post("/api/review", review, { origin: "https://evil.example" }), baseEnv);
  assert.equal(res.status, 403);

  res = await worker.fetch(post("/api/review", { ...review, website: "https://spam.example" }, { ip: "203.0.113.11" }), baseEnv);
  assert.equal(res.status, 400);
  assert.equal(calls.filter((c) => c.href.includes("/api/website-review")).length, 0);

  res = await worker.fetch(post("/api/review", { ...review, consent: false }, { ip: "203.0.113.12" }), baseEnv);
  assert.equal(res.status, 400);

  calls.length = 0;
  res = await worker.fetch(post("/api/review", review, { ip: "203.0.113.13" }), baseEnv);
  assert.equal(res.status, 200);
  const saved = await res.json();
  assert.equal(saved.ok, true);
  assert.match(saved.message, /after Sal approves/);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].href, "https://brokerage-preview.example/os/api/website-review");
  assert.equal(calls[0].method, "POST");
  const forwarded = JSON.parse(calls[0].bodyText);
  assert.deepEqual(forwarded, {
    name: "Jane Client",
    email: "jane@example.com",
    rating: 5,
    text: "Sal guided us from offer to closing.",
    property_or_service: "Sold our Brentwood home",
    consent: true,
    website: ""
  });
  assert.equal(calls[0].headers["X-Blackstone-Website-Secret"], undefined);

  calls.length = 0;
  res = await worker.fetch(post("/api/review", review, { ip: "203.0.113.14" }), { ...baseEnv, BROKERAGE_OS_WEBSITE_SECRET: "shared-secret" });
  assert.equal(res.status, 200);
  assert.equal(calls[0].headers["X-Blackstone-Website-Secret"], "shared-secret");

  calls.length = 0;
  res = await worker.fetch(post("/api/review", review, { ip: "203.0.113.15" }), { ...baseEnv, BROKERAGE_OS_BASE_URL: "http://evil.example" });
  assert.equal(res.status, 200);
  assert.equal(calls[0].href, "https://brokerage-os-master.pages.dev/api/website-review");

  for (let i = 0; i < 5; i++) {
    res = await worker.fetch(post("/api/review", review, { ip: "198.51.100.20" }), baseEnv);
    assert.equal(res.status, 200, "review " + i);
  }
  res = await worker.fetch(post("/api/review", review, { ip: "198.51.100.20" }), baseEnv);
  assert.equal(res.status, 429);

  calls.length = 0;
  res = await worker.fetch(new Request("https://preview.example/api/reviews"), baseEnv);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("Cache-Control"), "public, max-age=60");
  const reviews = await res.json();
  assert.equal(reviews.reviews.length, 2);
  assert.equal(reviews.reviews[0].name, "Jane");
  assert.equal(reviews.reviews[0].text, "Wonderful help.");
  assert.equal(reviews.reviews[0].text.includes("<"), false);
  assert.equal(reviews.reviews[0].text.includes("script"), false);
  assert.equal(reviews.reviews[0].rating, 5);
  assert.equal(reviews.reviews[1].name, "Sam");
  assert.equal(calls[0].href, "https://brokerage-preview.example/os/api/public/reviews");

  calls.length = 0;
  res = await worker.fetch(new Request("https://preview.example/api/reviews"), { ...baseEnv, BROKERAGE_OS_BASE_URL: "https://not-json.example" });
  assert.deepEqual(await res.json(), { reviews: [] });
  assert.equal(res.headers.get("Cache-Control"), "no-store");

  calls.length = 0;
  res = await worker.fetch(post("/api/leads", {
    name: "Chat Visitor",
    email: "chat@example.com",
    phone: "9255550199",
    message: "My name is Chat Visitor. Email chat@example.com",
    page: "/index.html",
    source: "chatbot",
    lead_type: "contact",
    consent_to_contact: true
  }, { ip: "203.0.113.40" }), baseEnv);
  assert.equal(res.status, 200);
  const lead = await res.json();
  assert.equal(lead.ok, true);
  assert.equal(lead.lead_id, "lead-1");
  const supabase = calls.find((c) => c.href.includes("/rest/v1/leads"));
  assert.equal(supabase.method, "POST");
  const payload = JSON.parse(supabase.bodyText);
  assert.equal(payload.source, "chatbot");
  assert.equal(payload.email, "chat@example.com");
  const mirror = calls.find((c) => c.href.includes("website-lead-intake"));
  assert.equal(mirror.href, "https://brokerage-os-master.pages.dev/api/website-lead-intake");
  assert.equal(JSON.parse(mirror.bodyText).source, "chatbot");

  calls.length = 0;
  res = await worker.fetch(post("/api/leads", {
    name: "Form Person",
    email: "form@example.com",
    source: "Website - Contact",
    lead_type: "buyer",
    consent_to_contact: true,
    fields: { name: "Form Person", email: "form@example.com" }
  }, { ip: "203.0.113.41" }), baseEnv);
  assert.equal(res.status, 200);
  const formLead = JSON.parse(calls.find((c) => c.href.includes("/rest/v1/leads")).bodyText);
  assert.equal(formLead.source, "Website - Contact");
  assert.equal(formLead.lead_type, "buyer");

  res = await worker.fetch(post("/api/leads", { email: "x@example.com" }, { origin: "https://evil.example", ip: "203.0.113.42" }), baseEnv);
  assert.equal(res.status, 403);

  res = await worker.fetch(new Request("https://preview.example/review"), baseEnv);
  assert.equal(res.status, 301);
  assert.equal(res.headers.get("Location"), "/review.html");

  res = await worker.fetch(new Request("https://preview.example/admin-hub"), baseEnv);
  assert.equal(res.status, 401);
  assert.match(res.headers.get("WWW-Authenticate") || "", /Basic/);

  res = await worker.fetch(new Request("https://preview.example/api/health"), baseEnv);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true, offlinePreview: false, idxEnabled: false });

  res = await worker.fetch(new Request("https://preview.example/api/master-repair"), baseEnv);
  assert.equal((await res.json()).stage, "64G");

  console.log("review route tests passed");
  globalThis.fetch = realFetch;
}

main().catch((error) => {
  globalThis.fetch = realFetch;
  console.error(error);
  process.exit(1);
});
