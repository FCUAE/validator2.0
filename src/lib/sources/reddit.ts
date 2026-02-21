import type { SourceResult, SourcePost } from '@/types/report';
import { fetchWithTimeout, analyzeSentiment, calculateOverallSentiment, calculateTrendDirection, normalizeEngagement, createEmptyResult } from './types';

const SUBREDDITS = ['startups', 'entrepreneur', 'SaaS', 'smallbusiness', 'Startup_Ideas', 'business'];

export async function scanReddit(query: string, _audience: string, timeframeDays: number): Promise<SourceResult> {
  try {
    const posts: SourcePost[] = [];
    const maxPerSubreddit = 5;

    const searches = SUBREDDITS.map(async (subreddit) => {
      try {
        const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(query)}&sort=relevance&t=${getTimeFilter(timeframeDays)}&limit=${maxPerSubreddit}&restrict_sr=1`;
        const response = await fetchWithTimeout(url, {
          headers: { 'User-Agent': 'ValidateIQ/1.0' },
        });
        if (!response.ok) return [];
        const data = await response.json();
        const children = data?.data?.children || [];
        return children.map((child: any) => {
          const post = child.data;
          return {
            title: post.title,
            content: post.selftext?.slice(0, 500) || post.title,
            url: `https://reddit.com${post.permalink}`,
            date: new Date(post.created_utc * 1000).toISOString(),
            engagement: post.score + (post.num_comments || 0),
            sentiment: analyzeSentiment(`${post.title} ${post.selftext || ''}`),
          } as SourcePost;
        });
      } catch {
        return [];
      }
    });

    const results = await Promise.allSettled(searches);
    for (const result of results) {
      if (result.status === 'fulfilled') {
        posts.push(...result.value);
      }
    }

    if (posts.length === 0) return createEmptyResult('reddit');

    const maxEng = Math.max(...posts.map(p => p.engagement), 1);
    const normalizedPosts = posts.map(p => ({
      ...p,
      engagement: normalizeEngagement(p.engagement, maxEng),
    }));

    return {
      source: 'reddit',
      available: true,
      posts: normalizedPosts.slice(0, 25),
      totalVolume: normalizedPosts.length,
      overallSentiment: calculateOverallSentiment(normalizedPosts),
      trendDirection: calculateTrendDirection(normalizedPosts),
    };
  } catch {
    return createEmptyResult('reddit');
  }
}

function getTimeFilter(days: number): string {
  if (days <= 7) return 'week';
  if (days <= 30) return 'month';
  return 'year';
}
