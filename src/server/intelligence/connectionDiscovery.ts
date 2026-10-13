import { db } from "../db.ts";
import { LifeMoment, UserProfile } from "../../types/index.ts";
import { InteractionStateMachine } from "./stateMachine.ts";

function windowOf(moment: LifeMoment) {
  const start = Date.parse(moment.startTime),
    end = Date.parse(moment.endTime);
  return Number.isFinite(start) && Number.isFinite(end) ? { start, end } : null;
}
export function compatibleMoments(
  a: LifeMoment,
  b: LifeMoment,
  ua: UserProfile,
  ub: UserProfile,
) {
  if (
    a.ownerId === b.ownerId ||
    a.status !== "ACTIVE" ||
    b.status !== "ACTIVE" ||
    a.sharingPermissions === "PRIVATE" ||
    b.sharingPermissions === "PRIVATE"
  )
    return null;
  if (
    ["REST_TIME", "FOOD_HUNGER", "SURPLUS_FOOD", "WORK_SHIFT"].includes(
      a.kind,
    ) ||
    ["REST_TIME", "FOOD_HUNGER", "SURPLUS_FOOD", "WORK_SHIFT"].includes(b.kind)
  )
    return null;
  const professional =
    /founder|business|professional|collaborat|network|investor|startup/i.test(
      a.goals.join(" "),
    );
  if (
    professional
      ? !(
          ua.consentSettings.allowProfessionalIntros &&
          ub.consentSettings.allowProfessionalIntros
        )
      : !(
          ua.consentSettings.allowSocialIntros &&
          ub.consentSettings.allowSocialIntros
        )
  )
    return null;
  const wa = windowOf(a),
    wb = windowOf(b);
  if (!wa || !wb) return null;
  const start = Math.max(wa.start, wb.start, Date.now()),
    end = Math.min(wa.end, wb.end);
  if (end - start < 15 * 60000) return null;
  const sameEvent = a.relatedEventId && a.relatedEventId === b.relatedEventId;
  if (
    !sameEvent &&
    a.approximateArea.toLowerCase() !== b.approximateArea.toLowerCase()
  )
    return null;
  const words = (values: string[]) =>
    new Set(
      values
        .join(" ")
        .toLowerCase()
        .match(/[\p{L}]{2,}/gu)
        ?.filter(
          (w) =>
            ![
              "meet",
              "with",
              "people",
              "want",
              "some",
              "someone",
              "near",
              "enjoy",
              "connect",
              "looking",
              "the",
              "and",
              "for",
              "to",
              "in",
              "of",
              "at",
            ].includes(w),
        ) || [],
    );
  const goalsA = words(a.goals),
    goalsB = words([...b.goals, ...ub.interests, ...ub.professions]);
  const shared = [...goalsA].filter((w) => goalsB.has(w));
  if (!shared.length) return null;
  // Protected activities take priority over a possible introduction.
  for (const user of [ua, ub]) {
    const blocked = db
      .getMoments(user.id)
      .some(
        (m) =>
          m.id !== a.id &&
          m.id !== b.id &&
          m.status === "ACTIVE" &&
          ["REST_TIME", "WORK_SHIFT"].includes(m.kind) &&
          windowOf(m) &&
          windowOf(m)!.start < start + 15 * 60000 &&
          windowOf(m)!.end > start,
      );
    if (blocked) return null;
  }
  return {
    score: Math.min(0.7 + shared.length * 0.04 + (sameEvent ? 0.1 : 0), 0.96),
    start,
    end: start + 15 * 60000,
    shared,
    professional,
  };
}
export class ConnectionDiscoveryEngine {
  static evaluateMoment(moment: LifeMoment) {
    const owner = db.getUserById(moment.ownerId);
    if (
      !owner ||
      moment.sharingPermissions === "PRIVATE" ||
      moment.status !== "ACTIVE"
    )
      return;
    const candidates = db
      .getMoments()
      .flatMap((other) => {
        const user = db.getUserById(other.ownerId);
        const match = user && compatibleMoments(moment, other, owner, user);
        return match ? [{ other, user: user!, match }] : [];
      })
      .sort((a, b) => b.match.score - a.match.score);
    for (const { other, user, match } of candidates) {
      const active = db
        .getProposals()
        .filter(
          (p) =>
            ![
              "DECLINED",
              "CANCELLED",
              "EXPIRED",
              "COMPLETED",
              "FAILED",
            ].includes(p.currentState),
        );
      if (
        active.some(
          (p) =>
            [p.initiatingUserId, p.recipientUserId].includes(owner.id) &&
            [p.initiatingUserId, p.recipientUserId].includes(user.id),
        )
      )
        continue;
      const week = Date.now() - 7 * 86400000;
      if (
        [owner, user].some(
          (u) =>
            db
              .getProposals(u.id)
              .filter(
                (p) =>
                  Date.parse(p.createdAt) > week &&
                  !["DECLINED", "CANCELLED", "EXPIRED"].includes(
                    p.currentState,
                  ),
              ).length >= u.consentSettings.maxWeeklyIntros,
        )
      )
        continue;
      const event = moment.relatedEventId
        ? db.getEventById(moment.relatedEventId)
        : undefined;
      InteractionStateMachine.createProposal({
        initiatingUserId: owner.id,
        recipientUserId: user.id,
        relatedMomentId: moment.id,
        recipientMomentId: other.id,
        reason: `Your plans overlap in ${moment.approximateArea}, with shared interests in ${match.shared.slice(0, 3).join(", ")}.`,
        matchScore: match.score,
        proposedTime: new Date(match.start).toISOString(),
        proposedPlace:
          event?.venue ||
          `A public meeting point in ${moment.approximateArea} (agree before meeting)`,
        meetingObjective: "A short introduction around your shared interests",
      });
      break;
    }
  }
}
