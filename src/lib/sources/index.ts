import type { SourceResult } from '@/types/report';
import { scanReddit } from './reddit';
import { scanHackerNews } from './hackernews';
import { scanGoogleTrends } from './google-trends';
import { scanTwitter } from './twitter-search';
import { scanLinkedIn } from './linkedin-search';
import { scanProductHunt } from './producthunt';
import { scanQuora } from './quora-search';
import { scanNews } from './news';
import { createEmptyResult } from './types';

interface SourceAdapterEntry {
  id: string;
  name: string;
  scan: (query: string, audience: string, timeframeDays: number) => Promise<SourceResult>;
}

export const sourceAdapters: SourceAdapterEntry[] = [
  { id: 'reddit', name: 'Reddit', scan: scanReddit },
  { id: 'hackernews', name: 'Hacker News', scan: scanHackerNews },
  { id: 'google_trends', name: 'Google Trends', scan: scanGoogleTrends },
  { id: 'twitter', name: 'X / Twitter', scan: scanTwitter },
  { id: 'linkedin', name: 'LinkedIn', scan: scanLinkedIn },
  { id: 'producthunt', name: 'Product Hunt', scan: scanProductHunt },
  { id: 'quora', name: 'Quora', scan: scanQuora },
  { id: 'news', name: 'News & Blogs', scan: scanNews },
];

export async function runAllAdapters(
  query: string,
  audience: string,
  timeframeDays: number,
  onProgress?: (sourceId: string, index: number) => void
): Promise<SourceResult[]> {
  const results = await Promise.allSettled(
    sourceAdapters.map(async (adapter, index) => {
      onProgress?.(adapter.id, index);
      try {
        return await adapter.scan(query, audience, timeframeDays);
      } catch {
        return createEmptyResult(adapter.id);
      }
    })
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') return result.value;
    return createEmptyResult(sourceAdapters[index].id);
  });
}
