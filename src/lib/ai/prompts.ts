import type { ScanMode } from '@/types/report';

const SHARED_JSON_SCHEMA = `{
  "overallScore": number (0-100),
  "confidence": "Low" | "Medium" | "High",
  "sources": {
    "[sourceId]": {
      "score": number (0-100),
      "sentiment": string,
      "trending": boolean,
      "summary": string (1-2 sentences),
      "signalCount": number
    }
  },
  "dimensions": [
    { "name": string, "score": number, "weight": number, "detail": string (1-2 sentences) }
  ],
  "verdict": string (3-5 sentences),
  "recommendations": [
    {
      "type": "feature" | "idea" | "tool" | "pivot",
      "title": string,
      "confidence": number (0-100),
      "description": string (2-3 sentences),
      "sources": string[]
    }
  ],
  "audienceInsights": {
    "primaryDemographic": string,
    "topPainPoints": string[] (exactly 5 items),
    "contentGaps": string[] (3-5 items)
  }
}`;

const SHARED_RULES = `Important rules:
- Generate 4-6 recommendations
- Base every score and recommendation on actual data from the sources provided
- Never hallucinate data points — only reference information present in the source data
- If a source returned no data (available: false), give it a score of 0 and note it was unavailable
- The overallScore should be a weighted average of the dimension scores using the weights specified
- The confidence level should be based on data volume: Low (< 20 total signals), Medium (20-50), High (> 50)
- For audience insights, infer demographics from the platform data and discussions found
- Each recommendation must cite which source platforms surfaced the insight

Respond ONLY with valid JSON. No markdown, no code fences, no additional text.`;

const IDEA_DIMENSIONS = `The "dimensions" array must include exactly these 6 items in this order:
1. "Market Demand" (weight: 0.25) — How much active interest exists for this type of product/service.
2. "Competition" (weight: 0.15) — How saturated the space is. Higher score = less competition or clear differentiation opportunity.
3. "Timing" (weight: 0.20) — Whether current trends, events, and cultural shifts favor this idea right now.
4. "Audience Reach" (weight: 0.15) — How accessible and active the target audience is online.
5. "Willingness to Pay" (weight: 0.15) — Signals around price sensitivity, spending behavior, and paid alternatives.
6. "Viral Potential" (weight: 0.10) — Likelihood of organic sharing and word-of-mouth based on the concept's nature.`;

const FEATURE_DIMENSIONS = `The "dimensions" array must include exactly these 6 items in this order:
1. "Feature Demand" (weight: 0.25) — How much active interest exists for this specific feature or capability among the target audience.
2. "Existing Alternatives" (weight: 0.15) — How many competing products or built-in features already solve this. Higher score = fewer or weaker alternatives.
3. "Timing" (weight: 0.20) — Whether current trends, user requests, and industry shifts favor launching this feature now.
4. "User Fit" (weight: 0.15) — How well this feature aligns with the existing user base and their workflows.
5. "Monetization Potential" (weight: 0.15) — Signals that users would pay more or upgrade for this feature, or that it improves retention.
6. "Adoption Likelihood" (weight: 0.10) — How easy it is for existing users to discover, understand, and start using this feature.`;

export function getSystemPrompt(mode: ScanMode): string {
  if (mode === 'feature') {
    return `You are an expert product strategist and feature analyst.
You will receive raw data from multiple online platforms about a specific feature or tool that an existing startup wants to build. Analyze all data and produce a structured validation report evaluating whether this feature is worth building.

You MUST respond with valid JSON matching this exact schema:
${SHARED_JSON_SCHEMA}

${FEATURE_DIMENSIONS}

${SHARED_RULES}
- The verdict should explain the key user need this feature addresses, the biggest risk or gap, and a specific recommendation for launch strategy (e.g., beta rollout, waitlist, premium-only).
- Recommendations should focus on implementation priorities, integration approaches, launch strategies, and potential upsell opportunities — not startup-level pivots.`;
  }

  return `You are an expert market analyst and startup advisor.
You will receive raw data from multiple online platforms about a specific startup idea. Analyze all data and produce a structured validation report.

You MUST respond with valid JSON matching this exact schema:
${SHARED_JSON_SCHEMA}

${IDEA_DIMENSIONS}

${SHARED_RULES}
- The verdict should explain the key strength, key risk, and a specific next-step recommendation.`;
}

// Keep backward-compatible export for any other imports
export const SYNTHESIS_SYSTEM_PROMPT = getSystemPrompt('idea');

export function buildUserPrompt(
  idea: string,
  audience: string,
  timeframeDays: number,
  sourceData: unknown[],
  mode: ScanMode = 'idea',
  startupContext?: string | null
): string {
  const base: Record<string, unknown> = {
    targetAudience: audience,
    analysisTimeframe: `${timeframeDays} days`,
    sourceResults: sourceData,
  };

  if (mode === 'feature') {
    base.existingStartup = startupContext;
    base.featureDescription = idea;
  } else {
    base.idea = idea;
  }

  return JSON.stringify(base);
}
