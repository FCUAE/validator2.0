import type { SourceResult, SourcePost } from '@/types/report';
import { fetchWithTimeout, analyzeSentiment, calculateOverallSentiment, calculateTrendDirection, normalizeEngagement, createEmptyResult } from './types';

export async function scanProductHunt(query: string, _audience: string, _timeframeDays: number): Promise<SourceResult> {
  // Try strict site search first, then broader fallback
  const siteResult = await trySerperSiteSearch(query);
  if (siteResult) return siteResult;

  const broadResult = await trySerperBroadSearch(query);
  if (broadResult) return broadResult;

  return createEmptyResult('producthunt');
}

async function trySerperSiteSearch(query: string): Promise<SourceResult | null> {
  try {
    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) return null;

    const response = await fetchWithTimeout('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: `site:www.producthunt.com ${query}`,
        num: 15,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const organic = data.organic || [];

    if (organic.length === 0) return null;

    return buildResult(organic);
  } catch {
    return null;
  }
}

async function trySerperBroadSearch(query: string): Promise<SourceResult | null> {
  try {
    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) return null;

    const response = await fetchWithTimeout('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: `"product hunt" ${query}`,
        num: 15,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const organic = (data.organic || []).filter((r: any) =>
      r.link?.includes('producthunt.com') || r.snippet?.toLowerCase().includes('product hunt')
    );

    if (organic.length === 0) return null;

    return buildResult(organic);
  } catch {
    return null;
  }
}

function buildResult(organic: any[]): SourceResult {
  const posts: SourcePost[] = organic.map((result: any, index: number) => ({
    title: result.title,
    content: result.snippet || result.title,
    url: result.link,
    date: result.date || new Date().toISOString(),
    engagement: Math.max(0, 100 - index * 10),
    sentiment: analyzeSentiment(result.snippet || result.title),
  }));

  const maxEng = Math.max(...posts.map(p => p.engagement), 1);
  const normalizedPosts = posts.map(p => ({
    ...p,
    engagement: normalizeEngagement(p.engagement, maxEng),
  }));

  return {
    source: 'producthunt',
    available: true,
    posts: normalizedPosts,
    totalVolume: normalizedPosts.length,
    overallSentiment: calculateOverallSentiment(normalizedPosts),
    trendDirection: calculateTrendDirection(normalizedPosts),
  };
}
