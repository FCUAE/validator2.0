import Anthropic from '@anthropic-ai/sdk';
import type { ValidationReport, ScanMode } from '@/types/report';
import type { SourceResult } from '@/types/report';
import { getSystemPrompt, buildUserPrompt } from './prompts';

export async function synthesizeReport(
  idea: string,
  audience: string,
  timeframeDays: number,
  sourceResults: SourceResult[],
  mode: ScanMode = 'idea',
  startupContext?: string | null
): Promise<ValidationReport> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const client = new Anthropic({ apiKey });

  const userMessage = buildUserPrompt(idea, audience, timeframeDays, sourceResults, mode, startupContext);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: userMessage,
      },
    ],
    system: getSystemPrompt(mode),
  });

  const textContent = response.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from AI');
  }

  let jsonText = textContent.text.trim();

  // Strip markdown code fences if present
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  const report: ValidationReport = JSON.parse(jsonText);

  // Validate required fields
  if (
    typeof report.overallScore !== 'number' ||
    !report.confidence ||
    !report.sources ||
    !Array.isArray(report.dimensions) ||
    !report.verdict ||
    !Array.isArray(report.recommendations) ||
    !report.audienceInsights
  ) {
    throw new Error('AI response missing required fields');
  }

  return report;
}
