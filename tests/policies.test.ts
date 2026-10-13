import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
process.env.LIFEOS_DATA_DIR = mkdtempSync(join(tmpdir(), "lifeos-policy-"));
const { db } = await import("../src/server/db.ts");
const { NotificationPolicyEngine, dubaiClock } =
  await import("../src/server/intelligence/notificationPolicy.ts");
const { compatibleMoments } =
  await import("../src/server/intelligence/connectionDiscovery.ts");
const { shiftIncludes } =
  await import("../src/server/intelligence/eventCascade.ts");
const { LifeFlowEngine } =
  await import("../src/server/intelligence/lifeFlow.ts");
import type { LifeMoment } from "../src/types/index.ts";
const user = structuredClone(db.getUsers()[0]);
user.id = "policy-test";
user.sessionToken = "a".repeat(64);
user.notificationBudget.maxPerDay = 3;
user.notificationBudget.usedToday = 0;
user.scheduleRoutine.quietHoursStart = "00:00";
user.scheduleRoutine.quietHoursEnd = "00:00";
db.updateUser(user);
const other = structuredClone(user);
other.id = "policy-other";
other.sessionToken = "b".repeat(64);
db.updateUser(other);
const moment = (id: string, ownerId: string): LifeMoment => ({
  id,
  ownerId,
  kind: "ATTENDING_EVENT",
  description: "Founder gathering",
  startTime: new Date(Date.now() + 3600000).toISOString(),
  endTime: new Date(Date.now() + 7200000).toISOString(),
  approximateArea: "Dubai Marina",
  goals: ["Meet AI founders"],
  preferences: [],
  protectedConstraints: [],
  sharingPermissions: "AGENT_COORDINATED",
  status: "ACTIVE",
  createdAt: new Date().toISOString(),
});
test("Dubai timezone and overnight work windows", () => {
  assert.equal(dubaiClock(new Date("2026-10-13T19:30:00Z")), "23:30");
  assert.equal(shiftIncludes("18:00 - 02:00", "23:00"), true);
  assert.equal(shiftIncludes("18:00 - 02:00", "01:00"), true);
  assert.equal(shiftIncludes("18:00 - 02:00", "10:00"), false);
});
test("private or nonoverlapping moments never create an introduction", () => {
  const a = moment("a", user.id),
    b = moment("b", other.id);
  assert.ok(compatibleMoments(a, b, user, other));
  assert.equal(
    compatibleMoments(a, { ...b, sharingPermissions: "PRIVATE" }, user, other),
    null,
  );
  assert.equal(
    compatibleMoments(
      a,
      {
        ...b,
        startTime: new Date(Date.now() + 9000000).toISOString(),
        endTime: new Date(Date.now() + 10000000).toISOString(),
      },
      user,
      other,
    ),
    null,
  );
  assert.equal(
    compatibleMoments({ ...a, kind: "FOOD_HUNGER" }, b, user, other),
    null,
  );
});
test("rest protects interruptions even for action-required updates", () => {
  const rest = {
    ...moment("rest", user.id),
    kind: "REST_TIME" as const,
    sharingPermissions: "PRIVATE" as const,
    startTime: new Date(Date.now() - 60000).toISOString(),
  };
  db.addMoment(rest);
  assert.equal(
    NotificationPolicyEngine.canDeliver(user.id, "ACTION_REQUIRED", "rest-test")
      .deliver,
    false,
  );
  rest.status = "CANCELLED";
  db.updateMoment(rest);
  assert.equal(
    NotificationPolicyEngine.canDeliver(user.id, "GENTLE", "awake-test")
      .deliver,
    true,
  );
});
test("daily budgets, deduplication and stop-topic preferences apply", () => {
  const n = {
    id: "notification-test",
    recipientUserId: user.id,
    priority: "GENTLE" as const,
    title: "Introduction",
    message: "A private proposal",
    deliveryStatus: "PENDING" as const,
    scheduledAt: new Date().toISOString(),
    deduplicationKey: "once",
    category: "INTRODUCTION" as const,
  };
  NotificationPolicyEngine.enqueue(n);
  NotificationPolicyEngine.enqueue({ ...n, id: "duplicate" });
  assert.equal(db.getNotifications(user.id).length, 1);
  NotificationPolicyEngine.handleUserFeedback(n.id, user.id, "STOP_TOPIC");
  NotificationPolicyEngine.enqueue({
    ...n,
    id: "stopped",
    deduplicationKey: "twice",
  });
  assert.equal(db.getNotifications(user.id).length, 1);
  user.notificationBudget.maxPerDay = 0;
  db.updateUser(user);
  assert.equal(
    NotificationPolicyEngine.canDeliver(user.id, "ACTION_REQUIRED", "budget")
      .deliver,
    false,
  );
});
test("schedule friction creates a grounded insight without broadcasting", () => {
  const a = moment("schedule-a", other.id),
    b = {
      ...moment("schedule-b", other.id),
      startTime: new Date(Date.now() + 5400000).toISOString(),
      endTime: new Date(Date.now() + 9000000).toISOString(),
    };
  db.addMoment(a);
  db.addMoment(b);
  LifeFlowEngine.review(other.id);
  LifeFlowEngine.review(other.id);
  assert.equal(
    db.getInsights(other.id).filter((i) => i.insightType === "SCHEDULE_BUFFER")
      .length,
    1,
  );
  assert.equal(
    db.getInsights(user.id).filter((i) => i.insightType === "SCHEDULE_BUFFER")
      .length,
    0,
  );
});
