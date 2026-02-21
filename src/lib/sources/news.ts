import type { SourceResult, SourcePost } from '@/types/report';
import { fetchWithTimeout, analyzeSentiment, calculateOverallSentiment, calculateTrendDirection, createEmptyResult } from './types';

export async function scanNews(query: string, _audience: string, _timeframeDays: number): Promise<SourceResult> {
  try {
    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) return createEmptyResult('news');

    const response = await fetchWithTimeout('https://google.serper.dev/news', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        num: 15,
      }),
    });

    if (!response.ok) return createEmptyResult('news');

    const data = await response.json();
    const articles = data.news || [];

    if (articles.length === 0) return createEmptyResult('news');

    const posts: SourcePost[] = articles.map((article: any) => ({
      title: article.title,
      content: article.snippet || article.title,
      url: article.link,
      date: article.date || new Date().toISOString(),
      engagement: 50,
      sentiment: analyzeSentiment(article.snippet || article.title),
    }));

    return {
      source: 'news',
      available: true,
      posts,
      totalVolume: posts.length,
      overallSentiment: calculateOverallSentiment(posts),
      trendDirection: calculateTrendDirection(posts),
    };
  } catch {
    return createEmptyResult('news');
  }
}
