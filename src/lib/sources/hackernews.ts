import type { SourceResult, SourcePost } from '@/types/report';
import { fetchWithTimeout, analyzeSentiment, calculateOverallSentiment, calculateTrendDirection, normalizeEngagement, createEmptyResult } from './types';

export async function scanHackerNews(query: string, _audience: string, timeframeDays: number): Promise<SourceResult> {
  try {
    const dateThreshold = Math.floor((Date.now() - timeframeDays * 24 * 60 * 60 * 1000) / 1000);
    const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&numericFilters=created_at_i>${dateThreshold}&hitsPerPage=25`;

    const response = await fetchWithTimeout(url);
    if (!response.ok) return createEmptyResult('hackernews');

    const data = await response.json();
    const hits = data.hits || [];

    if (hits.length === 0) return createEmptyResult('hackernews');

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
    return createEmptyResult('hackernews');
  }
}
