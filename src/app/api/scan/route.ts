import { NextRequest, NextResponse } from 'next/server';
import { createScan, findCachedScan } from '@/lib/db/queries';

// Allow up to 60 seconds for Vercel serverless
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { idea, audience, timeframe } = body;

    // Validate inputs
    if (!idea || typeof idea !== 'string' || idea.length > 500) {
      return NextResponse.json(
        { error: 'Invalid idea. Must be a string under 500 characters.' },
        { status: 400 }
      );
    }

    if (!audience || typeof audience !== 'string' || audience.length > 200) {
      return NextResponse.json(
        { error: 'Invalid audience. Must be a string under 200 characters.' },
        { status: 400 }
      );
    }

    const validTimeframes = [7, 30, 90];
    const tf = validTimeframes.includes(timeframe) ? timeframe : 30;

    // Check for cached scan (same idea+audience+timeframe in last 24h)
    try {
      const cached = await findCachedScan(idea, audience, tf);
      if (cached) {
        return NextResponse.json({ scanId: cached.id, cached: true });
      }
    } catch {
      // Cache check failed, continue with new scan
    }

    // Create a new scan
    const scan = await createScan(idea, audience, tf);

    // Trigger background scan processing
    // In production, this would use Inngest. For MVP, we'll process inline.
    processInBackground(scan.id, idea, audience, tf);

    return NextResponse.json({ scanId: scan.id });
  } catch (error) {
    console.error('Error creating scan:', error);
    return NextResponse.json(
      { error: 'Failed to create scan. Please try again.' },
      { status: 500 }
    );
  }
}

// Process scan in background (fire-and-forget)
async function processInBackground(
  scanId: string,
  idea: string,
  audience: string,
  timeframe: number
) {
  // Dynamic imports to avoid bundling issues
  const { updateScanProgress, completeScan, failScan } = await import('@/lib/db/queries');
  const { runAllAdapters } = await import('@/lib/sources/index');
  const { synthesizeReport } = await import('@/lib/ai/synthesize');
  const { SOURCE_LIST } = await import('@/types/report');

  try {
    // Update status to scanning
    await updateScanProgress(scanId, 5, null);

    // Track completed sources as a comma-separated list in current_source
    const completedSourceIds: string[] = [];

    const sourceResults = await runAllAdapters(
      idea,
      audience,
      timeframe,
      async (sourceId, completedCount) => {
        completedSourceIds.push(sourceId);
        const progress = Math.round((completedCount / SOURCE_LIST.length) * 70) + 5;
        // Store all completed sources so the frontend can track them
        await updateScanProgress(scanId, progress, completedSourceIds.join(','));
      }
    );

    // Update progress for AI synthesis
    await updateScanProgress(scanId, 80, 'ai_synthesis');

    // Run AI synthesis
    const report = await synthesizeReport(idea, audience, timeframe, sourceResults);

    // Complete the scan
    await completeScan(scanId, report);
  } catch (error) {
    console.error('Scan processing error:', error);
    await failScan(scanId);
  }
}
