import { NextRequest, NextResponse } from 'next/server';
import { getScan } from '@/lib/db/queries';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const scan = await getScan(params.id);

    if (!scan) {
      return NextResponse.json(
        { error: 'Scan not found' },
        { status: 404 }
      );
    }

    // Return scan status for polling (exclude full report to keep response small)
    return NextResponse.json({
      id: scan.id,
      status: scan.status,
      progress: scan.progress,
      current_source: scan.current_source,
      idea: scan.idea,
      audience: scan.audience,
      timeframe: scan.timeframe,
      created_at: scan.created_at,
      // Only include report if completed
      ...(scan.status === 'completed' ? { report: scan.report } : {}),
    });
  } catch (error) {
    console.error('Error fetching scan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scan status' },
      { status: 500 }
    );
  }
}
