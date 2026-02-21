import { type ClassValue, clsx } from 'clsx';

// Lightweight cn utility without tailwind-merge for MVP
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function getScoreColor(score: number): string {
  if (score >= 75) return 'text-green-400';
  if (score >= 50) return 'text-yellow-400';
  if (score >= 25) return 'text-orange-400';
  return 'text-red-400';
}

export function getScoreGradient(score: number): string {
  if (score >= 75) return 'from-green-500 to-emerald-400';
  if (score >= 50) return 'from-yellow-500 to-amber-400';
  if (score >= 25) return 'from-orange-500 to-amber-500';
  return 'from-red-500 to-rose-400';
}

export function getScoreBgColor(score: number): string {
  if (score >= 75) return 'bg-green-500/20 border-green-500/30';
  if (score >= 50) return 'bg-yellow-500/20 border-yellow-500/30';
  if (score >= 25) return 'bg-orange-500/20 border-orange-500/30';
  return 'bg-red-500/20 border-red-500/30';
}

export function getSentimentColor(sentiment: string): string {
  const s = sentiment.toLowerCase();
  if (s.includes('positive') || s.includes('rising')) return 'text-green-400';
  if (s.includes('negative') || s.includes('declining')) return 'text-red-400';
  return 'text-yellow-400';
}

export function getConfidenceBadgeColor(confidence: string): string {
  switch (confidence) {
    case 'High': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'Medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'Low': return 'bg-red-500/20 text-red-400 border-red-500/30';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

export function getTypeColor(type: string): string {
  switch (type) {
    case 'feature': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'idea': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'tool': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    case 'pivot': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}
