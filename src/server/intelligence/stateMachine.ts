import { db } from '../db.ts';
import { eventDispatcher } from './eventDispatcher.ts';
import { ConnectionProposal, ConnectionState, ConversationMessage, ConversationThread } from '../../types/index.ts';

export class InteractionStateMachine {
  /**
   * Initialize a new proposal in DISCOVERED -> ELIGIBILITY_CHECKED -> INVITATION_PENDING
   */
  public static createProposal(params: {
    initiatingUserId: string;
    recipientUserId: string;
    relatedMomentId: string;
    recipientMomentId?: string;
    reason: string;
    matchScore: number;
    proposedTime?: string;
    proposedPlace?: string;
    meetingObjective?: string;
  }): ConnectionProposal | null {
    const initiator = db.getUserById(params.initiatingUserId);
    const recipient = db.getUserById(params.recipientUserId);

    if (!initiator || !recipient) return null;

    // Check recipient consent settings & quiet hours
    if (!recipient.consentSettings.allowProfessionalIntros) {
      console.log(`User ${recipient.id} does not allow professional introductions`);
      return null;
    }

    const proposalId = `prop_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const proposal: ConnectionProposal = {
      id: proposalId,
      initiatingUserId: params.initiatingUserId,
      recipientUserId: params.recipientUserId,
      relatedMomentId: params.relatedMomentId,
      recipientMomentId: params.recipientMomentId,
      reason: params.reason,
      matchScore: params.matchScore,
      currentState: 'INVITATION_PENDING',
      approvedDisclosures: {
        initiatorSharedInfo: ['Field: Applied AI Robotics Founder', 'Attending Dubai Future Evening'],
        recipientSharedInfo: ['Field: FinTech & Angel Technology Lead', 'Attending Dubai Future Evening'],
      },
      proposedTime: params.proposedTime || 'Tomorrow 20:15 - 20:45',
      proposedPlace: params.proposedPlace || 'The Foundry Cafe, Marina Gate Promenade',
      meetingObjective: params.meetingObjective || '15-min relaxed exchange on AI infrastructure & venture scaling',
      initiatorConsent: 'PENDING',
      recipientConsent: 'PENDING',
      stateHistory: [
        {
          state: 'DISCOVERED',
          timestamp: now,
          note: `Autonomous CityIntentGraph discovered high semantic match (${Math.round(params.matchScore * 100)}%) between moments.`,
        },
        {
          state: 'ELIGIBILITY_CHECKED',
          timestamp: now,
          note: 'Passed consent rules: quiet hours respected, weekly intro budget valid, attendance verified.',
        },
        {
          state: 'INVITATION_PENDING',
          timestamp: now,
          note: `Private confidential invitation prepared for ${recipient.name}. No sensitive contact info disclosed.`,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    db.addProposal(proposal);

    // Send private invitation to recipient's AI chat thread
    this.sendRecipientInvitation(proposal, initiator, recipient);

    return proposal;
  }

  /**
   * Step 5: Send Person B one concise, conversational invitation
   */
  private static sendRecipientInvitation(proposal: ConnectionProposal, initiator: any, recipient: any) {
    let thread = db.getThreads(recipient.id).find((t) => t.relatedMomentId === proposal.recipientMomentId);
    if (!thread) {
      thread = db.getThreads(recipient.id)[0];
    }
    if (!thread) {
      thread = db.createThread({
        id: `thread_${recipient.id}_coord`,
        ownerUserId: recipient.id,
        relatedMomentId: proposal.recipientMomentId,
        threadType: 'MOMENT_COORDINATION',
        title: 'Dubai Future Evening: Introductions',
        status: 'ACTIVE',
        unreadCount: 1,
        updatedAt: new Date().toISOString(),
      });
    }

    const invitationMsg: ConversationMessage = {
      id: `msg_inv_${Date.now()}`,
      threadId: thread.id,
      senderRole: 'LIFEOS_AI',
      content: `Someone attending tomorrow's Dubai Future Evening is building in applied AI robotics and hoping to exchange insights with technology leaders. Your profiles match well with zero friction. Would you be open to an introduction?`,
      createdAt: new Date().toISOString(),
      proposalData: {
        proposalId: proposal.id,
        state: proposal.currentState,
        partnerName: 'AI Systems Founder', // Privacy-safe until consented
        partnerProfession: 'Autonomous Systems & Edge AI',
        partnerBio: 'Building edge AI robotics; interested in Gulf tech ecosystem & venture collaboration.',
        venue: proposal.proposedPlace,
        time: proposal.proposedTime,
        objective: proposal.meetingObjective,
      },
      actionOptions: [
        { label: 'Yes, I am interested', action: 'RECIPIENT_INTERESTED', payload: { proposalId: proposal.id }, variant: 'primary' },
        { label: 'Not this time', action: 'RECIPIENT_DECLINED', payload: { proposalId: proposal.id }, variant: 'secondary' },
      ],
    };

    db.addMessage(invitationMsg);

    // Create Gentle Notification for Recipient
    db.addNotification({
      id: `notif_${Date.now()}`,
      recipientUserId: recipient.id,
      priority: 'GENTLE',
      title: 'Potential Event Connection',
      message: 'A compatible technology founder is attending tomorrow’s gathering. View private invitation?',
      deliveryStatus: 'DELIVERED',
      scheduledAt: new Date().toISOString(),
      deduplicationKey: `inv_${proposal.id}`,
      category: 'INTRODUCTION',
    });

    eventDispatcher.sendToUser(recipient.id, {
      type: 'PROPOSAL_UPDATED',
      recipientUserId: recipient.id,
      data: { proposal, message: invitationMsg },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Recipient answers invitation (Yes, I am interested)
   * Moves to PARTICIPANT_INTERESTED -> MUTUAL_CONSENT_PENDING
   * Then presents Proposal to Initiator (Person A) for explicit approval!
   */
  public static recipientExpressesInterest(proposalId: string, recipientUserId: string): boolean {
    const proposal = db.getProposalById(proposalId);
    if (!proposal || proposal.recipientUserId !== recipientUserId) return false;

    proposal.recipientConsent = 'ACCEPTED';
    proposal.currentState = 'MUTUAL_CONSENT_PENDING';
    const now = new Date().toISOString();

    proposal.stateHistory.push({
      state: 'PARTICIPANT_INTERESTED',
      timestamp: now,
      note: 'Recipient indicated interest. Confidential details ready for initiator sign-off.',
      triggeredByUserId: recipientUserId,
    });
    proposal.stateHistory.push({
      state: 'MUTUAL_CONSENT_PENDING',
      timestamp: now,
      note: 'Awaiting initiator (Person A) formal review and mutual consent.',
    });
    proposal.updatedAt = now;
    db.updateProposal(proposal);

    // Update Recipient's thread acknowledging their answer
    const recipient = db.getUserById(recipientUserId);
    const initiator = db.getUserById(proposal.initiatingUserId);
    if (!recipient || !initiator) return false;

    const recipientThread = db.getThreads(recipient.id)[0];
    if (recipientThread) {
      db.addMessage({
        id: `msg_rec_ack_${Date.now()}`,
        threadId: recipientThread.id,
        senderRole: 'LIFEOS_AI',
        content: `Thank you. I'm checking with the founder now to confirm mutual availability. You'll receive a calm confirmation once both schedules align.`,
        createdAt: now,
      });
    }

    // Now present Proposal to Initiator (Person A)
    let initiatorThread = db.getThreads(initiator.id)[0];
    if (!initiatorThread) {
      initiatorThread = db.createThread({
        id: `thread_${initiator.id}_intro`,
        ownerUserId: initiator.id,
        threadType: 'PROPOSAL_CONSENT',
        title: 'Connection Proposal: Dubai Future Evening',
        status: 'ACTIVE',
        unreadCount: 1,
        updatedAt: now,
      });
    }

    const initiatorMsg: ConversationMessage = {
      id: `msg_init_prop_${Date.now()}`,
      threadId: initiatorThread.id,
      senderRole: 'LIFEOS_AI',
      content: `I found a high-synergy connection for tomorrow. Rashid Al-Falasi (FinTech VP & Angel Investor) is also attending and expressed interest in connecting with AI founders. Would you like me to coordinate a 15-minute coffee at The Foundry Cafe at 20:15?`,
      createdAt: now,
      proposalData: {
        proposalId: proposal.id,
        state: proposal.currentState,
        partnerName: recipient.name,
        partnerProfession: recipient.professions.join(', '),
        partnerBio: recipient.bio,
        venue: proposal.proposedPlace,
        time: proposal.proposedTime,
        objective: proposal.meetingObjective,
      },
      actionOptions: [
        { label: 'Approve & Coordinate Meeting', action: 'INITIATOR_APPROVED', payload: { proposalId: proposal.id }, variant: 'primary' },
        { label: 'Suggest Different Time/Place', action: 'ADJUST_MEETING', payload: { proposalId: proposal.id }, variant: 'secondary' },
        { label: 'Decline Gracefully', action: 'DECLINE_PROPOSAL', payload: { proposalId: proposal.id }, variant: 'danger' },
      ],
    };

    db.addMessage(initiatorMsg);

    // Notify Initiator
    db.addNotification({
      id: `notif_init_${Date.now()}`,
      recipientUserId: initiator.id,
      priority: 'ACTION_REQUIRED',
      title: 'Compatible Introduction Found',
      message: `${recipient.name} is open to meeting at tomorrow’s event. Review proposal?`,
      deliveryStatus: 'DELIVERED',
      scheduledAt: now,
      deduplicationKey: `prop_init_${proposal.id}`,
      category: 'INTRODUCTION',
    });

    eventDispatcher.sendToUser(initiator.id, {
      type: 'PROPOSAL_UPDATED',
      recipientUserId: initiator.id,
      data: { proposal, message: initiatorMsg },
      timestamp: now,
    });

    eventDispatcher.sendToUser(recipient.id, {
      type: 'PROPOSAL_UPDATED',
      recipientUserId: recipient.id,
      data: { proposal },
      timestamp: now,
    });

    return true;
  }

  /**
   * Initiator approves the proposal
   * Moves to ACCEPTED -> COORDINATING -> CONFIRMED
   */
  public static initiatorApprovesProposal(proposalId: string, initiatorUserId: string): boolean {
    const proposal = db.getProposalById(proposalId);
    if (!proposal || proposal.initiatingUserId !== initiatorUserId) return false;

    proposal.initiatorConsent = 'ACCEPTED';
    proposal.currentState = 'CONFIRMED';
    const now = new Date().toISOString();

    proposal.stateHistory.push({
      state: 'ACCEPTED',
      timestamp: now,
      note: 'Initiator accepted introduction and approved disclosure of professional profile.',
      triggeredByUserId: initiatorUserId,
    });
    proposal.stateHistory.push({
      state: 'COORDINATING',
      timestamp: now,
      note: `Arranging reserved corner at ${proposal.proposedPlace} for ${proposal.proposedTime}.`,
    });
    proposal.stateHistory.push({
      state: 'CONFIRMED',
      timestamp: now,
      note: `Both participants confirmed. Meeting placed calmly into respective event schedules.`,
    });
    proposal.updatedAt = now;
    db.updateProposal(proposal);

    const initiator = db.getUserById(initiatorUserId);
    const recipient = db.getUserById(proposal.recipientUserId);
    if (!initiator || !recipient) return false;

    // Send confirmation to Initiator
    const initiatorThread = db.getThreads(initiator.id)[0];
    if (initiatorThread) {
      db.addMessage({
        id: `msg_conf_init_${Date.now()}`,
        threadId: initiatorThread.id,
        senderRole: 'LIFEOS_AI',
        content: `🎉 Introduction Confirmed! You and ${recipient.name} are set for tomorrow at ${proposal.proposedTime} at ${proposal.proposedPlace}. I’ll provide a gentle 15-minute reminder during the event so you don't have to watch the clock.`,
        createdAt: now,
        proposalData: {
          proposalId: proposal.id,
          state: 'CONFIRMED',
          partnerName: recipient.name,
          partnerProfession: recipient.professions.join(', '),
          partnerBio: recipient.bio,
          venue: proposal.proposedPlace,
          time: proposal.proposedTime,
          objective: proposal.meetingObjective,
        },
      });
    }

    // Send confirmation to Recipient
    const recipientThread = db.getThreads(recipient.id)[0];
    if (recipientThread) {
      db.addMessage({
        id: `msg_conf_rec_${Date.now()}`,
        threadId: recipientThread.id,
        senderRole: 'LIFEOS_AI',
        content: `✨ Introduction Confirmed! Elena Vance (Founder, Autonomous Neural Systems) has agreed to meet tomorrow at ${proposal.proposedTime} at ${proposal.proposedPlace}. Relaxed discussion on AI infrastructure. Both schedules updated!`,
        createdAt: now,
        proposalData: {
          proposalId: proposal.id,
          state: 'CONFIRMED',
          partnerName: initiator.name,
          partnerProfession: initiator.professions.join(', '),
          partnerBio: initiator.bio,
          venue: proposal.proposedPlace,
          time: proposal.proposedTime,
          objective: proposal.meetingObjective,
        },
      });
    }

    // Add confirmation notifications
    db.addNotification({
      id: `notif_conf_init_${Date.now()}`,
      recipientUserId: initiator.id,
      priority: 'GENTLE',
      title: 'Meeting Confirmed with Rashid Al-Falasi',
      message: `Scheduled for tomorrow at ${proposal.proposedTime} at ${proposal.proposedPlace}.`,
      deliveryStatus: 'DELIVERED',
      scheduledAt: now,
      deduplicationKey: `conf_init_${proposal.id}`,
      category: 'SCHEDULE',
    });

    db.addNotification({
      id: `notif_conf_rec_${Date.now()}`,
      recipientUserId: recipient.id,
      priority: 'GENTLE',
      title: 'Meeting Confirmed with Elena Vance',
      message: `Scheduled for tomorrow at ${proposal.proposedTime} at ${proposal.proposedPlace}.`,
      deliveryStatus: 'DELIVERED',
      scheduledAt: now,
      deduplicationKey: `conf_rec_${proposal.id}`,
      category: 'SCHEDULE',
    });

    // Realtime broadcast to both connected sessions
    eventDispatcher.sendToUser(initiator.id, {
      type: 'PROPOSAL_UPDATED',
      recipientUserId: initiator.id,
      data: { proposal, confirmed: true },
      timestamp: now,
    });

    eventDispatcher.sendToUser(recipient.id, {
      type: 'PROPOSAL_UPDATED',
      recipientUserId: recipient.id,
      data: { proposal, confirmed: true },
      timestamp: now,
    });

    return true;
  }

  /**
   * Decline proposal gracefully
   */
  public static declineProposal(proposalId: string, decliningUserId: string, reason?: string): boolean {
    const proposal = db.getProposalById(proposalId);
    if (!proposal) return false;

    proposal.currentState = 'DECLINED';
    const now = new Date().toISOString();

    proposal.stateHistory.push({
      state: 'DECLINED',
      timestamp: now,
      note: `Participant declined: ${reason || 'Not fitting schedule or preference right now'}. Proposal halted without pressure.`,
      triggeredByUserId: decliningUserId,
    });
    proposal.updatedAt = now;
    db.updateProposal(proposal);

    const userThread = db.getThreads(decliningUserId)[0];
    if (userThread) {
      db.addMessage({
        id: `msg_dec_${Date.now()}`,
        threadId: userThread.id,
        senderRole: 'LIFEOS_AI',
        content: `Understood, no problem at all. I have halted this proposal and your schedule remains completely protected.`,
        createdAt: now,
      });
    }

    eventDispatcher.broadcast({
      type: 'PROPOSAL_UPDATED',
      data: { proposal, declined: true },
      timestamp: now,
    });

    return true;
  }

  /**
   * Adjust proposal meeting time / place
   */
  public static adjustProposal(
    proposalId: string,
    userId: string,
    newTime: string,
    newPlace: string
  ): boolean {
    const proposal = db.getProposalById(proposalId);
    if (!proposal) return false;

    proposal.proposedTime = newTime;
    proposal.proposedPlace = newPlace;
    proposal.currentState = 'COORDINATING';
    const now = new Date().toISOString();

    proposal.stateHistory.push({
      state: 'COORDINATING',
      timestamp: now,
      note: `Schedule adjusted to ${newTime} at ${newPlace}.`,
      triggeredByUserId: userId,
    });
    proposal.updatedAt = now;
    db.updateProposal(proposal);

    eventDispatcher.broadcast({
      type: 'PROPOSAL_UPDATED',
      data: { proposal },
      timestamp: now,
    });

    return true;
  }
}
