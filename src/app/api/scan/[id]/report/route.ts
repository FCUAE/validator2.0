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

    if (scan.status !== 'completed' || !scan.report) {
      return NextResponse.json(
        { error: 'Report not ready', status: scan.status },
        { status: 202 }
      );
    }

    return NextResponse.json({
      id: scan.id,
      idea: scan.idea,
      audience: scan.audience,
      timeframe: scan.timeframe,
      report: scan.report,
      created_at: scan.created_at,
      completed_at: scan.completed_at,
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch report' },
      { status: 500 }
    );
  }
}
