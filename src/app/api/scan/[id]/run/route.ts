import { NextRequest } from 'next/server';
import { sourceAdapters } from '@/lib/sources/index';
import { synthesizeReport } from '@/lib/ai/synthesize';
import { createEmptyResult } from '@/lib/sources/types';
import type { SourceResult, ScanMode } from '@/types/report';

// Allow up to 300 seconds for the streaming scan (Vercel caps to plan limit)
export const maxDuration = 300;

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const scanId = params.id;
  let body: { idea: string; audience: string; timeframe: number; mode?: ScanMode; startupContext?: string | null };

  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { idea, audience, timeframe, mode = 'idea', startupContext = null } = body;

  if (!idea || !audience) {
    return new Response(JSON.stringify({ error: 'Missing idea or audience' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Build the search query — for feature mode, combine startup context with the feature description
  const searchQuery = mode === 'feature' && startupContext
    ? `${startupContext} ${idea}`
    : idea;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: Record<string, unknown>) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Controller may be closed if client disconnected
        }
      };

      try {
        sendEvent({ type: 'started', totalSources: sourceAdapters.length });

        // Run all 8 source adapters in parallel
        const sourceResults: SourceResult[] = new Array(sourceAdapters.length);
        let completedCount = 0;

        const promises = sourceAdapters.map(async (adapter, index) => {
          let result: SourceResult;
          try {
            result = await adapter.scan(searchQuery, audience, timeframe);
            sourceResults[index] = result;
          } catch {
            result = createEmptyResult(adapter.id);
            sourceResults[index] = result;
          }

          completedCount++;
          sendEvent({
            type: 'source_complete',
            sourceId: adapter.id,
            sourceName: adapter.name,
            available: result.available,
            postCount: result.posts.length,
            completedCount,
            totalSources: sourceAdapters.length,
          });
        });

        await Promise.allSettled(promises);

        // AI Synthesis phase
        sendEvent({ type: 'synthesizing' });

        const report = await synthesizeReport(idea, audience, timeframe, sourceResults, mode, startupContext);

        // Try to persist to DB (works with Supabase, no-op with in-memory on Vercel)
        try {
          const { completeScan } = await import('@/lib/db/queries');
          await completeScan(scanId, report);
        } catch {
          // DB save failed — report is still sent via stream
        }

        sendEvent({ type: 'complete', report });
      } catch (error) {
        console.error('Streaming scan error:', error);
        sendEvent({
          type: 'error',
          message: 'Scan failed. Please try again.',
        });

        try {
          const { failScan } = await import('@/lib/db/queries');
          await failScan(scanId);
        } catch {
          // Best-effort DB update
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
