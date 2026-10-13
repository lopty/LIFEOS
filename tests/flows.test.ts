import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn, ChildProcess } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const port = 3187,
  base = `http://127.0.0.1:${port}`,
  dir = mkdtempSync(join(tmpdir(), "lifeos-test-"));
let server: ChildProcess,
  a: string,
  b: string,
  c: string,
  pid: string,
  eventId: string,
  threadId: string;
function start() {
  server = spawn(
    process.execPath,
    ["--import", "tsx", "server.ts", "--production"],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PORT: String(port),
        LIFEOS_DATA_DIR: dir,
        ENABLE_DEMO: "true",
        GEMINI_API_KEY: "",
        DISABLE_HMR: "true",
      },
      stdio: "pipe",
    },
  );
  server.stderr?.on("data", (data) => process.stderr.write(data));
}
async function ready() {
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(base + "/health")).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("Test server did not start");
}
async function request(path: string, token = "", method = "GET", body?: any) {
  const response = await fetch(base + "/api" + path, {
    method,
    headers: { "Content-Type": "application/json", "x-session-token": token },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { status: response.status, data: await response.json() };
}
before(async () => {
  start();
  await ready();
  a = (
    await request("/demo/session", "", "POST", { userId: "user_elena_vance" })
  ).data.sessionToken;
  b = (
    await request("/demo/session", "", "POST", {
      userId: "user_rashid_alfalasi",
    })
  ).data.sessionToken;
  const created = await request("/users", "", "POST", {
    name: "Private Participant",
  });
  c = created.data.sessionToken;
});
after(() => {
  server.kill();
});
test("unguessable sessions and user-scoped access", async () => {
  assert.equal((await request("/session", "user_elena_vance")).status, 401);
  assert.equal((await request("/moments")).status, 401);
  assert.ok(c.length >= 64);
  const session = (await request("/session", a)).data;
  assert.equal(session.user.sessionToken, undefined);
  assert.deepEqual((await request("/users", a)).data.users, []);
  threadId = (await request("/threads", a)).data.threads[0].id;
  assert.equal((await request(`/threads/${threadId}/messages`, b)).status, 404);
  assert.equal(
    (
      await request(`/threads/${threadId}/messages`, b, "POST", {
        content: "hello",
      })
    ).status,
    404,
  );
  assert.equal((await request("/moments?all=true", c)).data.moments.length, 0);
});
test("missing Gemini key produces a clear error without fake responses", async () => {
  const previous = (await request(`/threads/${threadId}/messages`, a)).data
    .messages.length;
  const response = await request(`/threads/${threadId}/messages`, a, "POST", {
    content: "I am hungry",
  });
  assert.equal(response.status, 400);
  assert.match(response.data.error, /GEMINI_API_KEY/);
  assert.equal(
    (await request(`/threads/${threadId}/messages`, a)).data.messages.length,
    previous,
  );
});
test("two independent approvals, replay protection and shared confirmed plans", async () => {
  assert.equal(
    (await request("/demo/run-scenario", a, "POST", { scenario: "SCENARIO_A" }))
      .status,
    200,
  );
  const proposals = (await request("/proposals", a)).data.proposals;
  assert.equal(proposals.length, 1);
  pid = proposals[0].id;
  assert.equal(proposals[0].currentState, "INVITATION_PENDING");
  assert.equal(
    (
      await request(`/proposals/${pid}/respond`, a, "POST", {
        action: "INITIATOR_APPROVED",
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await request(`/proposals/${pid}/respond`, c, "POST", {
        action: "DECLINE",
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await request(`/proposals/${pid}/respond`, b, "POST", {
        action: "RECIPIENT_INTERESTED",
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await request(`/proposals/${pid}/respond`, b, "POST", {
        action: "RECIPIENT_INTERESTED",
      })
    ).status,
    409,
  );
  let p = (await request("/proposals", a)).data.proposals[0];
  assert.equal(p.currentState, "MUTUAL_CONSENT_PENDING");
  assert.deepEqual(p.approvedDisclosures.initiatorSharedInfo, []);
  assert.equal(
    (
      await request(`/proposals/${pid}/respond`, a, "POST", {
        action: "INITIATOR_APPROVED",
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await request(`/proposals/${pid}/respond`, a, "POST", {
        action: "INITIATOR_APPROVED",
      })
    ).status,
    409,
  );
  p = (await request("/proposals", b)).data.proposals[0];
  assert.equal(p.currentState, "CONFIRMED");
  for (const token of [a, b]) {
    assert.equal(
      (await request("/moments", token)).data.moments.filter((m: any) =>
        m.id.startsWith("meeting_"),
      ).length,
      1,
    );
  }
});
test("changing a meeting invalidates both approvals", async () => {
  const time = new Date(Date.now() + 87000000).toISOString();
  assert.equal(
    (
      await request(`/proposals/${pid}/respond`, b, "POST", {
        action: "ADJUST",
        newTime: time,
        newPlace: "Public terrace",
      })
    ).status,
    200,
  );
  const p = (await request("/proposals", a)).data.proposals[0];
  assert.equal(p.currentState, "INVITATION_PENDING");
  assert.equal(p.initiatorConsent, "PENDING");
  assert.equal(p.recipientConsent, "PENDING");
  assert.equal(
    (
      await request(`/proposals/${pid}/respond`, a, "POST", {
        action: "INITIATOR_APPROVED",
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await request(`/proposals/${pid}/respond`, b, "POST", {
        action: "RECIPIENT_INTERESTED",
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await request(`/proposals/${pid}/respond`, a, "POST", {
        action: "INITIATOR_APPROVED",
      })
    ).status,
    200,
  );
  assert.equal(
    (await request("/moments", a)).data.moments.filter(
      (m: any) => m.id.startsWith("meeting_") && m.status === "COORDINATING",
    ).length,
    1,
  );
});
test("attendance is idempotent and cancellation reduces actual demand", async () => {
  eventId = (await request("/events", a)).data.events[0].id;
  const before = (await request("/events", a)).data.events[0]
    .confirmedAttendance;
  for (let i = 0; i < 2; i++)
    assert.equal(
      (await request(`/events/${eventId}/rsvp`, a, "POST", { attending: true }))
        .status,
      200,
    );
  assert.equal(
    (await request("/events", a)).data.events[0].confirmedAttendance,
    before + 1,
  );
  assert.equal(
    (await request("/moments", a)).data.moments.filter(
      (m: any) => m.id === `attendance_${eventId}_user_elena_vance`,
    ).length,
    1,
  );
  await request(`/events/${eventId}/rsvp`, a, "POST", { attending: false });
  assert.equal(
    (await request("/events", a)).data.events[0].confirmedAttendance,
    before,
  );
});
test("food sample requires approval and creates an outcome", async () => {
  await request("/demo/run-scenario", c, "POST", { scenario: "SCENARIO_C" });
  const insight = (await request("/insights", c)).data.insights.find((i: any) =>
    i.id.startsWith("demo_food_"),
  );
  assert.equal(
    (await request(`/insights/${insight.id}/execute`, a, "POST", {})).status,
    409,
  );
  assert.equal(
    (await request(`/insights/${insight.id}/execute`, c, "POST", {})).status,
    200,
  );
  assert.equal(
    (await request(`/insights/${insight.id}/execute`, c, "POST", {})).status,
    409,
  );
  assert.ok((await request("/outcomes", c)).data.outcomes.length > 0);
});
test("profile validation preserves identity and paper trades reject invalid quantities", async () => {
  const u = (await request("/session", c)).data.user;
  await request("/users/profile", c, "PUT", {
    id: "user_elena_vance",
    sessionToken: a,
    professions: ["Parent", "Teacher"],
  });
  assert.equal((await request("/session", c)).data.user.id, u.id);
  assert.equal(
    (
      await request("/paper/trade", c, "POST", {
        symbol: "EMAAR",
        side: "BUY",
        quantity: -2,
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request("/paper/trade", c, "POST", {
        symbol: "EMAAR",
        side: "BUY",
        quantity: 0.5,
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request("/paper/trade", c, "POST", {
        symbol: "EMAAR",
        side: "BUY",
        quantity: 10,
      })
    ).status,
    200,
  );
  assert.equal((await request("/paper", c)).data.account.holdings.EMAAR, 10);
  assert.equal(
    (await request("/paper", a)).data.account.holdings.EMAAR,
    undefined,
  );
});
test("SQLite persists participants and paper portfolio across a server restart", async () => {
  const stopped = new Promise((r) => server.once("exit", r));
  server.kill();
  await stopped;
  start();
  await ready();
  assert.equal((await request("/session", c)).status, 200);
  assert.equal((await request("/paper", c)).data.account.holdings.EMAAR, 10);
  assert.equal(
    (await request("/proposals", a)).data.proposals[0].currentState,
    "CONFIRMED",
  );
});
test("taxi insights use independent attendance and retire when demand disappears", async () => {
  const driver = (
    await request("/demo/session", "", "POST", { userId: "user_tariq_mansoor" })
  ).data.sessionToken;
  await request(`/events/${eventId}/rsvp`, a, "POST", { attending: true });
  await request(`/events/${eventId}/rsvp`, b, "POST", { attending: true });
  const insight = (await request("/insights", driver)).data.insights.find(
    (i: any) => i.id.startsWith("transport_"),
  );
  assert.ok(insight);
  assert.match(insight.evidence, /2 independently confirmed/);
  assert.match(insight.evidence, /30%/);
  await request(`/events/${eventId}/rsvp`, a, "POST", { attending: false });
  await request(`/events/${eventId}/rsvp`, b, "POST", { attending: false });
  const retired = (await request("/insights", driver)).data.insights.find(
    (i: any) => i.id === insight.id,
  );
  assert.equal(retired.status, "DISMISSED");
  assert.equal(retired.isActionable, false);
});
