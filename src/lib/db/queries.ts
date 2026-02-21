import { createClient } from '@supabase/supabase-js';
import type { Scan, UserProfile, ValidationReport } from '@/types/report';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }
  return createClient(url, key);
}

export async function createScan(
  idea: string,
  audience: string,
  timeframe: number,
  userId?: string
): Promise<Scan> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('scans')
    .insert({
      idea,
      audience,
      timeframe,
      user_id: userId || null,
      status: 'pending',
      progress: 0,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create scan: ${error.message}`);
  return data as Scan;
}

export async function getScan(id: string): Promise<Scan | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('scans')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data as Scan;
}

export async function updateScanProgress(
  id: string,
  progress: number,
  currentSource: string | null
): Promise<void> {
  const supabase = getServiceClient();
  await supabase
    .from('scans')
    .update({
      status: 'scanning',
      progress,
      current_source: currentSource,
    })
    .eq('id', id);
}

export async function completeScan(
  id: string,
  report: ValidationReport
): Promise<void> {
  const supabase = getServiceClient();
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
}

export async function failScan(id: string): Promise<void> {
  const supabase = getServiceClient();
  await supabase
    .from('scans')
    .update({
      status: 'failed',
      current_source: null,
    })
    .eq('id', id);
}

export async function getUserScans(userId: string): Promise<Scan[]> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('scans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data as Scan[];
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) return null;
  return data as UserProfile;
}

export async function incrementUserScans(userId: string): Promise<void> {
  const supabase = getServiceClient();
  await supabase.rpc('increment_scans', { user_id_input: userId });
}

export async function findCachedScan(
  idea: string,
  audience: string,
  timeframe: number
): Promise<Scan | null> {
  const supabase = getServiceClient();
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data } = await supabase
    .from('scans')
    .select('*')
    .eq('idea', idea)
    .eq('audience', audience)
    .eq('timeframe', timeframe)
    .eq('status', 'completed')
    .gte('created_at', oneDayAgo)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return data as Scan | null;
}
