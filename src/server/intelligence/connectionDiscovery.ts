import { db } from '../db.ts';
import { InteractionStateMachine } from './stateMachine.ts';
import { LifeMoment, UserProfile } from '../../types/index.ts';

export class ConnectionDiscoveryEngine {
  /**
   * Run discovery for a freshly created or updated LifeMoment
   */
  public static evaluateMoment(newMoment: LifeMoment) {
    const owner = db.getUserById(newMoment.ownerId);
    if (!owner) return;

    // If moment is private or resting, do not attempt public matching
    if (newMoment.sharingPermissions === 'PRIVATE' || newMoment.kind === 'REST_TIME') {
      console.log(`Moment ${newMoment.id} is private/resting; suppressing external discovery.`);
      return;
    }

    const allMoments = db.getMoments().filter((m) => m.id !== newMoment.id && m.status === 'ACTIVE');
    const existingProposals = db.getProposals();

    for (const otherMoment of allMoments) {
      if (otherMoment.ownerId === newMoment.ownerId) continue;
      const otherUser = db.getUserById(otherMoment.ownerId);
      if (!otherUser) continue;

      // Prevent duplicate proposals
      const alreadyProposed = existingProposals.some(
        (p) =>
          (p.initiatingUserId === owner.id && p.recipientUserId === otherUser.id) ||
          (p.initiatingUserId === otherUser.id && p.recipientUserId === owner.id)
      );
      if (alreadyProposed) continue;

      // Check mutual benefit
      const match = this.assessMutualBenefit(newMoment, owner, otherMoment, otherUser);
      if (match.isCompatible && match.score >= 0.7) {
        console.log(`Discovered compatible connection between ${owner.name} and ${otherUser.name} (Score: ${match.score})`);

        InteractionStateMachine.createProposal({
          initiatingUserId: owner.id,
          recipientUserId: otherUser.id,
          relatedMomentId: newMoment.id,
          recipientMomentId: otherMoment.id,
          reason: match.reason,
          matchScore: match.score,
          proposedTime: 'Tomorrow 20:15 - 20:45',
          proposedPlace: 'The Foundry Cafe, Marina Gate Promenade',
          meetingObjective: 'Exchange insights on applied AI robotics & technology venture ecosystem',
        });
        break; // Process highest priority match first to avoid overwhelming
      }
    }
  }

  private static assessMutualBenefit(
    momentA: LifeMoment,
    userA: UserProfile,
    momentB: LifeMoment,
    userB: UserProfile
  ): { isCompatible: boolean; score: number; reason: string } {
    // 1. Consent check
    if (!userA.consentSettings.allowProfessionalIntros || !userB.consentSettings.allowProfessionalIntros) {
      return { isCompatible: false, score: 0, reason: 'Consent policy prohibited' };
    }

    // 2. Event or Area Co-presence check
    const sameEvent = Boolean(momentA.relatedEventId && momentA.relatedEventId === momentB.relatedEventId);
    const sameArea = momentA.approximateArea === momentB.approximateArea;

    if (!sameEvent && !sameArea) {
      return { isCompatible: false, score: 0, reason: 'Different areas and events' };
    }

    // 3. Semantic synergy between goals & professions
    let synergyScore = 0.5;
    const goalsA = momentA.goals.map((g) => g.toLowerCase()).join(' ');
    const goalsB = momentB.goals.map((g) => g.toLowerCase()).join(' ');
    const profA = userA.professions.map((p) => p.toLowerCase()).join(' ');
    const profB = userB.professions.map((p) => p.toLowerCase()).join(' ');

    const hasAiKeywords =
      (goalsA.includes('ai') || goalsA.includes('founder') || profA.includes('ai')) &&
      (goalsB.includes('ai') || goalsB.includes('founder') || profB.includes('fintech') || profB.includes('investor'));

    if (hasAiKeywords) synergyScore += 0.35;
    if (sameEvent) synergyScore += 0.15;

    return {
      isCompatible: synergyScore >= 0.7,
      score: Math.min(synergyScore, 0.96),
      reason: `Both attending ${sameEvent ? 'Dubai Future Evening' : momentA.approximateArea} with complementary goals in AI robotics and technology scaling.`,
    };
  }
}
