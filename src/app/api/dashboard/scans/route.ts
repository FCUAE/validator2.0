import { NextResponse } from 'next/server';
import { getAllScans } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const scans = await getAllScans();
    return NextResponse.json({ scans });
  } catch (error) {
    console.error('Error fetching scans:', error);
    return NextResponse.json({ scans: [] });
  }
}
