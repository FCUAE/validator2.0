import type { SourceResult, SourcePost } from '@/types/report';
import { fetchWithTimeout, analyzeSentiment, calculateOverallSentiment, calculateTrendDirection, normalizeEngagement, createEmptyResult } from './types';

export async function scanHackerNews(query: string, _audience: string, timeframeDays: number): Promise<SourceResult> {
  // Try Algolia API first (native HN search), fall back to Serper
  const algoliaResult = await tryAlgolia(query, timeframeDays);
  if (algoliaResult) return algoliaResult;

  const serperResult = await trySerper(query);
  if (serperResult) return serperResult;

  return createEmptyResult('hackernews');
}

async function tryAlgolia(query: string, timeframeDays: number): Promise<SourceResult | null> {
  try {
    const dateThreshold = Math.floor((Date.now() - timeframeDays * 24 * 60 * 60 * 1000) / 1000);
    const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&numericFilters=created_at_i>${dateThreshold}&hitsPerPage=25`;

    const response = await fetchWithTimeout(url, {}, 10000);
    if (!response.ok) return null;

    const data = await response.json();
    const hits = data.hits || [];

    if (hits.length === 0) return null;

    const posts: SourcePost[] = hits.map((hit: any) => ({
      title: hit.title,
      content: hit.title + (hit.story_text ? ` - ${hit.story_text.slice(0, 300)}` : ''),
      url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
      date: new Date(hit.created_at_i * 1000).toISOString(),
      engagement: (hit.points || 0) + (hit.num_comments || 0),
      sentiment: analyzeSentiment(hit.title + ' ' + (hit.story_text || '')),
    }));

    const maxEng = Math.max(...posts.map(p => p.engagement), 1);
    const normalizedPosts = posts.map(p => ({
      ...p,
      engagement: normalizeEngagement(p.engagement, maxEng),
    }));

    return {
      source: 'hackernews',
      available: true,
      posts: normalizedPosts,
      totalVolume: data.nbHits || normalizedPosts.length,
      overallSentiment: calculateOverallSentiment(normalizedPosts),
      trendDirection: calculateTrendDirection(normalizedPosts),
    };
  } catch {
    return null;
  }
}

async function trySerper(query: string): Promise<SourceResult | null> {
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
        q: `site:news.ycombinator.com ${query}`,
        num: 15,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const organic = data.organic || [];

    if (organic.length === 0) return null;

    const posts: SourcePost[] = organic.map((result: any, index: number) => ({
      title: result.title,
      content: result.snippet || result.title,
      url: result.link,
      date: result.date || new Date().toISOString(),
      engagement: Math.max(0, 100 - index * 7),
      sentiment: analyzeSentiment(result.snippet || result.title),
    }));

    const maxEng = Math.max(...posts.map(p => p.engagement), 1);
    const normalizedPosts = posts.map(p => ({
      ...p,
      engagement: normalizeEngagement(p.engagement, maxEng),
    }));

    return {
      source: 'hackernews',
      available: true,
      posts: normalizedPosts,
      totalVolume: normalizedPosts.length,
      overallSentiment: calculateOverallSentiment(normalizedPosts),
      trendDirection: calculateTrendDirection(normalizedPosts),
    };
  } catch {
    return null;
  }
}
