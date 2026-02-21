import type { SourceResult, SourcePost } from '@/types/report';
import { fetchWithTimeout, analyzeSentiment, calculateOverallSentiment, calculateTrendDirection, createEmptyResult } from './types';

export async function scanTwitter(query: string, _audience: string, _timeframeDays: number): Promise<SourceResult> {
  try {
    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) return createEmptyResult('twitter');

    const response = await fetchWithTimeout('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: `site:twitter.com OR site:x.com ${query}`,
        num: 15,
      }),
    });

    if (!response.ok) return createEmptyResult('twitter');

    const data = await response.json();
    const organic = data.organic || [];

    if (organic.length === 0) return createEmptyResult('twitter');

    const posts: SourcePost[] = organic.map((result: any) => ({
      title: result.title,
      content: result.snippet || result.title,
      url: result.link,
      date: result.date || new Date().toISOString(),
      engagement: result.position ? Math.max(0, 100 - result.position * 7) : 50,
      sentiment: analyzeSentiment(result.snippet || result.title),
    }));

    return {
      source: 'twitter',
      available: true,
      posts,
      totalVolume: posts.length,
      overallSentiment: calculateOverallSentiment(posts),
      trendDirection: calculateTrendDirection(posts),
    };
  } catch {
    return createEmptyResult('twitter');
  }
}
