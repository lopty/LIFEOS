import { GoogleGenAI, Type } from '@google/genai';
import { MomentType, UserProfile } from '../../types/index.ts';

let aiInstance: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

export interface InterpretedMomentResult {
  kind: MomentType;
  approximateArea: string;
  goals: string[];
  preferences: string[];
  protectedConstraints: string[];
  sharingPermissions: 'PRIVATE' | 'AGENT_COORDINATED' | 'COMMUNITY_VISIBLE';
  startTimeStr: string;
  endTimeStr: string;
}

function timeoutAfter<T>(promise: Promise<T>, ms: number = 5000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('AI request timeout')), ms)),
  ]);
}

export async function interpretLifeMoment(
  rawText: string,
  user: UserProfile
): Promise<InterpretedMomentResult> {
  const ai = getAIClient();
  if (ai) {
    try {
      const prompt = `You are the LIFEOS Living City Intelligence Engine for Dubai.
A resident described a moment in their life:
"${rawText}"

User context:
- Name: ${user.name}
- Profession: ${user.professions.join(', ')}
- Primary Area: ${user.primaryArea}
- Frequented Areas: ${user.frequentedAreas.join(', ')}

Analyze the text and extract:
1. kind: One of ["ATTENDING_EVENT", "WORK_SHIFT", "FOOD_HUNGER", "SOCIAL_GATHERING", "NETWORKING_MEETING", "REST_TIME", "SERVICE_OFFER", "SURPLUS_FOOD", "COMMUNITY_ACTIVITY", "TRANSIT_JOURNEY"].
2. approximateArea: The specific Dubai district (e.g., "Dubai Marina", "Downtown Dubai", "DIFC", "Business Bay", "Alserkal Avenue", "Palm Jumeirah", "JBR"). Default to user's primary area if unspecified.
3. goals: String array of the human intentions (e.g., ["Meet AI founders", "Explore seed funding"], NOT just the event name).
4. preferences: Constraints/preferences for comfort (e.g., ["Quiet corner", "Under 60 AED", "Casual ambience"]).
5. protectedConstraints: Privacy or boundary constraints (e.g., ["Keep contact info private", "No sales pitches", "Wrap before 22:00"]).
6. sharingPermissions: "AGENT_COORDINATED" (if they want AI to find matches), "COMMUNITY_VISIBLE", or "PRIVATE" (for resting, personal notes).
7. startTimeStr: Brief timing indication (e.g. "Tomorrow 19:00" or "Immediate" or "Friday 18:00").
8. endTimeStr: Brief end timing (e.g. "Tomorrow 23:00" or "In 2 hours").`;

      const response = await timeoutAfter(
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                kind: { type: Type.STRING },
                approximateArea: { type: Type.STRING },
                goals: { type: Type.ARRAY, items: { type: Type.STRING } },
                preferences: { type: Type.ARRAY, items: { type: Type.STRING } },
                protectedConstraints: { type: Type.ARRAY, items: { type: Type.STRING } },
                sharingPermissions: { type: Type.STRING },
                startTimeStr: { type: Type.STRING },
                endTimeStr: { type: Type.STRING },
              },
              required: [
                'kind',
                'approximateArea',
                'goals',
                'preferences',
                'protectedConstraints',
                'sharingPermissions',
              ],
            },
          },
        }),
        5000
      );

      if (response.text) {
        const parsed = JSON.parse(response.text);
        return {
          kind: (parsed.kind as MomentType) || 'ATTENDING_EVENT',
          approximateArea: parsed.approximateArea || user.primaryArea,
          goals: Array.isArray(parsed.goals) && parsed.goals.length > 0 ? parsed.goals : ['Meaningful connection'],
          preferences: Array.isArray(parsed.preferences) ? parsed.preferences : [],
          protectedConstraints: Array.isArray(parsed.protectedConstraints) ? parsed.protectedConstraints : ['Keep direct contact private until consent'],
          sharingPermissions: (parsed.sharingPermissions as any) || 'AGENT_COORDINATED',
          startTimeStr: parsed.startTimeStr || 'Tomorrow 19:00',
          endTimeStr: parsed.endTimeStr || 'Tomorrow 23:00',
        };
      }
    } catch (err) {
      console.warn('Gemini interpretation failed or timed out, applying heuristic:', err);
    }
  }

  // Resilient heuristic interpreter fallback
  const textLower = rawText.toLowerCase();
  let kind: MomentType = 'ATTENDING_EVENT';
  let approximateArea = user.primaryArea;
  const goals: string[] = [];
  const preferences: string[] = [];
  const constraints: string[] = ['Keep direct phone and personal contact private until mutual agreement'];
  let sharingPermissions: 'PRIVATE' | 'AGENT_COORDINATED' | 'COMMUNITY_VISIBLE' = 'AGENT_COORDINATED';

  // Area detection
  if (textLower.includes('marina') || textLower.includes('jbr')) approximateArea = 'Dubai Marina';
  else if (textLower.includes('downtown') || textLower.includes('burj')) approximateArea = 'Downtown Dubai';
  else if (textLower.includes('difc')) approximateArea = 'DIFC';
  else if (textLower.includes('business bay')) approximateArea = 'Business Bay';
  else if (textLower.includes('alserkal') || textLower.includes('quoz')) approximateArea = 'Alserkal Avenue';
  else if (textLower.includes('palm')) approximateArea = 'Palm Jumeirah';

  // Kind & Intentions
  if (textLower.includes('hungry') || textLower.includes('food') || textLower.includes('eat') || textLower.includes('dinner')) {
    kind = 'FOOD_HUNGER';
    goals.push('Find satisfying nutritious meal nearby without friction');
    preferences.push('Under 80 AED', 'Within 10 mins walking or quick delivery');
  } else if (textLower.includes('rest') || textLower.includes('sleep') || textLower.includes('do not disturb') || textLower.includes('tired')) {
    kind = 'REST_TIME';
    sharingPermissions = 'PRIVATE';
    goals.push('Uninterrupted personal rejuvenation');
    constraints.push('Suppress all non-emergency city notifications');
  } else if (textLower.includes('shift') || textLower.includes('driving') || textLower.includes('taxi') || textLower.includes('work')) {
    kind = 'WORK_SHIFT';
    goals.push('Smooth high-yield mobility without dead mileage');
  } else if (textLower.includes('surplus') || textLower.includes('food rescue')) {
    kind = 'SURPLUS_FOOD';
    goals.push('Offer certified artisan surplus food to community');
  } else {
    // Event / networking
    kind = 'ATTENDING_EVENT';
    if (textLower.includes('founder') || textLower.includes('tech') || textLower.includes('ai')) {
      goals.push('Connect with technology founders building AI businesses');
      goals.push('Explore early technical partnerships or co-founder synergy');
    } else {
      goals.push('Experience the atmosphere and meet inspiring peers');
    }
    preferences.push('Focused 15-20 min high-value conversation', 'Quiet cafe or quiet corner');
  }

  return {
    kind,
    approximateArea,
    goals,
    preferences,
    protectedConstraints: constraints,
    sharingPermissions,
    startTimeStr: 'Tomorrow 19:00',
    endTimeStr: 'Tomorrow 23:00',
  };
}

export async function generateCompanionReply(
  userMessage: string,
  user: UserProfile,
  threadHistory: { senderRole: string; content: string }[],
  activeMoment?: any
): Promise<{ reply: string; suggestedClarification?: string }> {
  const ai = getAIClient();
  if (ai) {
    try {
      const historyStr = threadHistory
        .slice(-4)
        .map((h) => `${h.senderRole === 'USER' ? user.name : 'LIFEOS'}: ${h.content}`)
        .join('\n');

      const prompt = `You are LIFEOS, the living-city AI operating system for Dubai.
Tagline: "Live your best life in Dubai. Let the city work with you."
Philosophy:
- You are a respectful, intelligent companion, NOT a notification engine, ad stream, or gig marketplace.
- You make life more enjoyable, convenient, meaningful, and economically connected.
- You NEVER pressure users to monetize their lives.
- You respect voluntary context and boundaries.
- Sometimes the best action is doing nothing.
- When an attendee says "I'm attending this event tomorrow. Make it fun for me.", ask a natural clarifying question like:
  "What would make it a great event for you? Meeting people, learning something, making business connections or just enjoying yourself?"
  (Do NOT ask unnecessary questions if the user already stated their goal).
- If they specify their intention (e.g. "I want to meet founders building AI"), acknowledge with warmth and confidence that LIFEOS is quietly coordinating compatibility and will propose private introductions once mutual interest is established.

User Profile:
- Name: ${user.name}
- Profession: ${user.professions.join(', ')}
- Location: ${user.primaryArea}
${activeMoment ? `- Active Life Moment: ${activeMoment.description} (Kind: ${activeMoment.kind})` : ''}

Recent conversation:
${historyStr}

User just said:
"${userMessage}"

Respond in 2-3 warm, intelligent, concise sentences.`;

      const response = await timeoutAfter(
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        }),
        5000
      );

      if (response.text) {
        return { reply: response.text.trim() };
      }
    } catch (err) {
      console.warn('Gemini companion reply timed out or failed, using heuristic:', err);
    }
  }

  // Graceful rule-based companion reply
  const lower = userMessage.toLowerCase();
  if (lower.includes('make it fun') || lower.includes('what should i do')) {
    return {
      reply: `I'm on it. What would make it a memorable evening for you: meeting peers in deep-tech, discovering new ideas, or just soaking in the Marina atmosphere without networking pressure?`,
      suggestedClarification: 'Meeting people or enjoying the experience?',
    };
  }

  if (lower.includes('founder') || lower.includes('connect') || lower.includes('meet') || lower.includes('network')) {
    return {
      reply: `Understood. I have recorded your intention to connect with technology founders. I am quietly reviewing attendees who have opted into introductions and will send a discreet proposal once both sides find mutual value.`,
    };
  }

  if (lower.includes('hungry') || lower.includes('food')) {
    return {
      reply: `Understood. I am checking verified culinary spots and fresh food partners in ${user.primaryArea} that match your pace. I have wholesome options ready for you.`,
    };
  }

  return {
    reply: `I have updated your context for today. I'm quietly working with the city around your schedule so you can stay fully present.`,
  };
}
