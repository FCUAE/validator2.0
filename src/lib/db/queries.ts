import type { Scan, ScanMode, UserProfile, ValidationReport } from '@/types/report';
import { v4 as uuidv4 } from 'uuid';

// ---------------------------------------------------------------------------
// In-memory store — used when Supabase env vars are not configured.
// This lets you run the full app locally with just ANTHROPIC_API_KEY.
// ---------------------------------------------------------------------------
const memoryStore = new Map<string, Scan>();

function useSupabase(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function getServiceClient() {
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ---------------------------------------------------------------------------
// createScan
// ---------------------------------------------------------------------------
export async function createScan(
  idea: string,
  audience: string,
  timeframe: number,
  userId?: string,
  mode: ScanMode = 'idea',
  startupContext: string | null = null
): Promise<Scan> {
  if (useSupabase()) {
    const supabase = await getServiceClient();
    const { data, error } = await supabase
      .from('scans')
      .insert({
        idea,
        audience,
        timeframe,
        mode,
        startup_context: startupContext,
        user_id: userId || null,
        status: 'pending',
        progress: 0,
      })
      .select()
      .single();
    if (error) throw new Error(`Failed to create scan: ${error.message}`);
    return data as Scan;
  }

  // In-memory fallback
  const scan: Scan = {
    id: uuidv4(),
    user_id: userId || null,
    mode,
    idea,
    audience,
    startup_context: startupContext,
    timeframe,
    status: 'pending',
    progress: 0,
    current_source: null,
    report: null,
    created_at: new Date().toISOString(),
    completed_at: null,
    updated_at: new Date().toISOString(),
    error_message: null,
  };
  memoryStore.set(scan.id, scan);
  return scan;
}

// ---------------------------------------------------------------------------
// getScan
// ---------------------------------------------------------------------------
export async function getScan(id: string): Promise<Scan | null> {
  if (useSupabase()) {
    const supabase = await getServiceClient();
    const { data, error } = await supabase
      .from('scans')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data as Scan;
  }

  return memoryStore.get(id) || null;
}

// ---------------------------------------------------------------------------
// updateScanProgress
// ---------------------------------------------------------------------------
export async function updateScanProgress(
  id: string,
  progress: number,
  currentSource: string | null
): Promise<void> {
  if (useSupabase()) {
    const supabase = await getServiceClient();
    await supabase
      .from('scans')
      .update({ status: 'scanning', progress, current_source: currentSource })
      .eq('id', id);
    return;
  }

  const scan = memoryStore.get(id);
  if (scan) {
    scan.status = 'scanning';
    scan.progress = progress;
    scan.current_source = currentSource;
  }
}

// ---------------------------------------------------------------------------
// completeScan
// ---------------------------------------------------------------------------
export async function completeScan(
  id: string,
  report: ValidationReport
): Promise<void> {
  if (useSupabase()) {
    const supabase = await getServiceClient();
    await supabase
      .from('scans')
      .update({
        status: 'completed',
        progress: 100,
        current_source: null,
        report: report as unknown as Record<string, unknown>,
        completed_at: new Date().toISOString(),
      })
      .eq('id', id);
    return;
  }

  const scan = memoryStore.get(id);
  if (scan) {
    scan.status = 'completed';
    scan.progress = 100;
    scan.current_source = null;
    scan.report = report;
    scan.completed_at = new Date().toISOString();
  }
}

// ---------------------------------------------------------------------------
// failScan
// ---------------------------------------------------------------------------
export async function failScan(id: string): Promise<void> {
  if (useSupabase()) {
    const supabase = await getServiceClient();
    await supabase
      .from('scans')
      .update({ status: 'failed', current_source: null })
      .eq('id', id);
    return;
  }

  const scan = memoryStore.get(id);
  if (scan) {
    scan.status = 'failed';
    scan.current_source = null;
  }
}

// ---------------------------------------------------------------------------
// getAllScans — returns every scan in memory (admin view, no auth needed)
// ---------------------------------------------------------------------------
export async function getAllScans(): Promise<Scan[]> {
  if (useSupabase()) {
    const supabase = await getServiceClient();
    const { data, error } = await supabase
      .from('scans')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return [];
    return data as Scan[];
  }

  return Array.from(memoryStore.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

// ---------------------------------------------------------------------------
// getUserScans
// ---------------------------------------------------------------------------
export async function getUserScans(userId: string): Promise<Scan[]> {
  if (useSupabase()) {
    const supabase = await getServiceClient();
    const { data, error } = await supabase
      .from('scans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) return [];
    return data as Scan[];
  }

  return Array.from(memoryStore.values())
    .filter((s) => s.user_id === userId)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

// ---------------------------------------------------------------------------
// getUserProfile
// ---------------------------------------------------------------------------
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (useSupabase()) {
    const supabase = await getServiceClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) return null;
    return data as UserProfile;
  }

  return null;
}

// ---------------------------------------------------------------------------
// incrementUserScans
// ---------------------------------------------------------------------------
export async function incrementUserScans(userId: string): Promise<void> {
  if (useSupabase()) {
    const supabase = await getServiceClient();
    await supabase.rpc('increment_scans', { user_id_input: userId });
  }
}

// ---------------------------------------------------------------------------
// findCachedScan
// ---------------------------------------------------------------------------
export async function findCachedScan(
  idea: string,
  audience: string,
  timeframe: number
): Promise<Scan | null> {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

  if (useSupabase()) {
    const supabase = await getServiceClient();
    const { data } = await supabase
      .from('scans')
      .select('*')
      .eq('idea', idea)
      .eq('audience', audience)
      .eq('timeframe', timeframe)
      .eq('status', 'completed')
      .gte('created_at', new Date(oneDayAgo).toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    return data as Scan | null;
  }

  // In-memory cache lookup
  for (const scan of memoryStore.values()) {
    if (
      scan.idea === idea &&
      scan.audience === audience &&
      scan.timeframe === timeframe &&
      scan.status === 'completed' &&
      new Date(scan.created_at).getTime() > oneDayAgo
    ) {
      return scan;
    }
  }
  return null;
}
