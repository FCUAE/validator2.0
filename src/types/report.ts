export interface SourcePost {
  title?: string;
  content: string;
  url?: string;
  date: string;
  engagement: number; // normalized 0-100
  sentiment?: 'positive' | 'negative' | 'neutral';
}

export interface SourceResult {
  source: string;
  available: boolean;
  posts: SourcePost[];
  totalVolume: number;
  overallSentiment: string;
  trendDirection: 'rising' | 'stable' | 'declining';
  rawData?: unknown;
}

export interface SourceScore {
  score: number;
  sentiment: string;
  trending: boolean;
  summary: string;
  signalCount: number;
}

export interface ValidationDimension {
  name: string;
  score: number;
  weight: number;
  detail: string;
}

export interface Recommendation {
  type: 'feature' | 'idea' | 'tool' | 'pivot';
  title: string;
  confidence: number;
  description: string;
  sources: string[];
}

export interface AudienceInsights {
  primaryDemographic: string;
  topPainPoints: string[];
  contentGaps: string[];
}

export interface ValidationReport {
  overallScore: number;
  confidence: 'Low' | 'Medium' | 'High';
  sources: Record<string, SourceScore>;
  dimensions: ValidationDimension[];
  verdict: string;
  recommendations: Recommendation[];
  audienceInsights: AudienceInsights;
}

export type ScanMode = 'idea' | 'feature';

export interface Scan {
  id: string;
  user_id: string | null;
  mode: ScanMode;
  idea: string;
  audience: string;
  startup_context: string | null;
  timeframe: number;
  status: 'pending' | 'scanning' | 'completed' | 'failed';
  progress: number;
  current_source: string | null;
  report: ValidationReport | null;
  created_at: string;
  completed_at: string | null;
  updated_at: string | null;
  error_message: string | null;
}

export type PlanTier = 'free' | 'pro' | 'teams';

export interface UserProfile {
  id: string;
  email: string;
  plan: PlanTier;
  scans_this_month: number;
  stripe_customer_id: string | null;
  created_at: string;
}

export const SOURCE_LIST = [
  { id: 'reddit', name: 'Reddit', icon: '💬' },
  { id: 'hackernews', name: 'Hacker News', icon: '🔶' },
  { id: 'google_trends', name: 'Google Trends', icon: '📈' },
  { id: 'twitter', name: 'X / Twitter', icon: '𝕏' },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼' },
  { id: 'producthunt', name: 'Product Hunt', icon: '🚀' },
  { id: 'quora', name: 'Quora', icon: '❓' },
  { id: 'news', name: 'News & Blogs', icon: '📰' },
] as const;

export type SourceId = typeof SOURCE_LIST[number]['id'];

export const PLAN_LIMITS: Record<PlanTier, { scansPerMonth: number; price: number }> = {
  free: { scansPerMonth: 2, price: 0 },
  pro: { scansPerMonth: 20, price: 29 },
  teams: { scansPerMonth: 999999, price: 79 },
};

export const DIMENSION_WEIGHTS: Record<string, number> = {
  'Market Demand': 0.25,
  'Competition': 0.15,
  'Timing': 0.20,
  'Audience Reach': 0.15,
  'Willingness to Pay': 0.15,
  'Viral Potential': 0.10,
};
