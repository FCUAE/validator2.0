import type { SourceResult } from '@/types/report';

export interface SourceAdapter {
  id: string;
  name: string;
  scan(query: string, audience: string, timeframeDays: number): Promise<SourceResult>;
}

export async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

export function analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const positiveWords = ['love', 'great', 'amazing', 'excellent', 'awesome', 'fantastic', 'perfect', 'best', 'helpful', 'useful', 'recommend', 'good', 'impressive', 'innovative', 'brilliant', 'wonderful', 'excited', 'game-changer'];
  const negativeWords = ['hate', 'terrible', 'awful', 'worst', 'bad', 'horrible', 'useless', 'waste', 'scam', 'disappointing', 'poor', 'broken', 'failed', 'sucks', 'avoid', 'overpriced', 'buggy'];

  const lower = text.toLowerCase();
  let positiveCount = 0;
  let negativeCount = 0;

  for (const word of positiveWords) {
    if (lower.includes(word)) positiveCount++;
  }
  for (const word of negativeWords) {
    if (lower.includes(word)) negativeCount++;
  }

  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

export function calculateOverallSentiment(posts: { sentiment?: string }[]): string {
  if (posts.length === 0) return 'neutral';
  const counts = { positive: 0, negative: 0, neutral: 0 };
  for (const post of posts) {
    const s = (post.sentiment || 'neutral') as keyof typeof counts;
    if (s in counts) counts[s]++;
  }
  if (counts.positive > counts.negative && counts.positive > counts.neutral) return 'Positive';
  if (counts.negative > counts.positive && counts.negative > counts.neutral) return 'Negative';
  if (counts.positive === counts.negative && counts.positive > 0) return 'Mixed';
  return 'Neutral';
}

export function calculateTrendDirection(posts: { date: string }[]): 'rising' | 'stable' | 'declining' {
  if (posts.length < 2) return 'stable';
  const sorted = [...posts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const mid = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, mid).length;
  const secondHalf = sorted.slice(mid).length;
  if (secondHalf > firstHalf * 1.2) return 'rising';
  if (firstHalf > secondHalf * 1.2) return 'declining';
  return 'stable';
}

export function normalizeEngagement(value: number, max: number): number {
  if (max === 0) return 0;
  return Math.min(100, Math.round((value / max) * 100));
}

export function createEmptyResult(source: string): SourceResult {
  return {
    source,
    available: false,
    posts: [],
    totalVolume: 0,
    overallSentiment: 'N/A',
    trendDirection: 'stable',
  };
}
