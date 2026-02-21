import type { SourceResult } from '@/types/report';
import { fetchWithTimeout, createEmptyResult } from './types';

export async function scanGoogleTrends(query: string, _audience: string, _timeframeDays: number): Promise<SourceResult> {
  try {
    // Use Serper API for Google Trends data via regular search with trend indicators
    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) return createEmptyResult('google_trends');

    const response = await fetchWithTimeout('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: `${query} trend`,
        num: 10,
      }),
    });

    if (!response.ok) return createEmptyResult('google_trends');

    const data = await response.json();
    const organic = data.organic || [];
    const relatedSearches = data.relatedSearches || [];

    const posts = organic.map((result: any) => ({
      title: result.title,
      content: result.snippet || result.title,
      url: result.link,
      date: new Date().toISOString(),
      engagement: result.position ? Math.max(0, 100 - result.position * 10) : 50,
      sentiment: 'neutral' as const,
    }));

    return {
      source: 'google_trends',
      available: true,
      posts,
      totalVolume: posts.length + relatedSearches.length,
      overallSentiment: posts.length > 5 ? 'Active' : 'Moderate',
      trendDirection: posts.length > 7 ? 'rising' : posts.length > 3 ? 'stable' : 'declining',
      rawData: { relatedSearches },
    };
  } catch {
    return createEmptyResult('google_trends');
  }
}
