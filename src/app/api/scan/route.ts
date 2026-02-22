import { NextRequest, NextResponse } from 'next/server';
import { createScan, findCachedScan } from '@/lib/db/queries';

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

    // Create a new scan record
    const scan = await createScan(idea, audience, tf);

    // Scan processing is now handled by the SSE streaming endpoint
    // at POST /api/scan/[id]/run — called by the frontend directly.
    return NextResponse.json({ scanId: scan.id });
  } catch (error) {
    console.error('Error creating scan:', error);
    return NextResponse.json(
      { error: 'Failed to create scan. Please try again.' },
      { status: 500 }
    );
  }
}
