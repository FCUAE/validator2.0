'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ScanProgress from '@/components/scan-progress';
import ScoreRing from '@/components/report/score-ring';
import DimensionsGrid from '@/components/report/dimensions-grid';
import AiVerdict from '@/components/report/ai-verdict';
import SourceBreakdown from '@/components/report/source-breakdown';
import Recommendations from '@/components/report/recommendations';
import AudienceIntel from '@/components/report/audience-intel';
import type { ValidationReport, Scan, ScanMode } from '@/types/report';
import { getConfidenceBadgeColor } from '@/lib/utils';

type TabId = 'overview' | 'sources' | 'recommendations' | 'audience';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'sources', label: 'Sources' },
  { id: 'recommendations', label: 'Recommendations' },
  { id: 'audience', label: 'Audience' },
];

export default function ScanPage() {
  const params = useParams();
  const router = useRouter();
  const scanId = params.id as string;
  const [scan, setScan] = useState<Scan | null>(null);
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scanParams, setScanParams] = useState<{
    mode?: ScanMode;
    idea: string;
    audience: string;
    startupContext?: string | null;
    timeframe: number;
  } | null>(null);

  const scanMode: ScanMode = scan?.mode ?? scanParams?.mode ?? 'idea';
  const isFeatureMode = scanMode === 'feature';

  // Check if scan already has a report, or load params for a new streaming scan
  useEffect(() => {
    async function checkScan() {
      try {
        const res = await fetch(`/api/scan/${scanId}`);
        if (res.ok) {
          const data = await res.json();
          setScan(data);
          if (data.status === 'completed' && data.report) {
            setReport(data.report);
            setShowReport(true);
            setLoading(false);
            return;
          } else if (data.status === 'failed') {
            setError(data.error_message || 'This scan failed. Please start a new one.');
            setLoading(false);
            return;
          }
        }
      } catch {
        // Backend check failed — continue to sessionStorage
      }

      // Load scan params from sessionStorage for a new streaming scan
      try {
        const stored = sessionStorage.getItem(`scan_params_${scanId}`);
        if (stored) {
          setScanParams(JSON.parse(stored));
        }
      } catch {
        // sessionStorage access failed
      }
      setLoading(false);
    }
    checkScan();
  }, [scanId]);

  const handleScanComplete = useCallback((completedReport: ValidationReport) => {
    setReport(completedReport);
    setScan((prev) => prev ? { ...prev, status: 'completed', report: completedReport } : null);
    setShowReport(true);
    // Clean up sessionStorage
    try {
      sessionStorage.removeItem(`scan_params_${scanId}`);
    } catch { /* ignore */ }
  }, [scanId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="border-b border-zinc-800/50 backdrop-blur-sm sticky top-0 z-50 bg-zinc-950/80">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="font-bold text-lg">ValidateIQ</span>
          </a>
          <a href="/" className="text-sm text-zinc-400 hover:text-white transition-colors">
            New Scan
          </a>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {error && !showReport ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center min-h-[60vh]"
            >
              <div className="w-full max-w-md text-center">
                <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <svg className="w-10 h-10 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-300 mb-4">{error}</p>
                  <button
                    onClick={() => router.push('/')}
                    className="px-6 py-2.5 text-sm font-medium rounded-lg bg-brand-600 text-white hover:bg-brand-500 transition-colors"
                  >
                    Start New Scan
                  </button>
                </div>
              </div>
            </motion.div>
          ) : !showReport ? (
            <motion.div
              key="scanning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center justify-center min-h-[60vh]"
            >
              <ScanProgress
                scanId={scanId}
                mode={scanParams?.mode}
                idea={scanParams?.idea}
                audience={scanParams?.audience}
                startupContext={scanParams?.startupContext}
                timeframe={scanParams?.timeframe}
                onComplete={handleScanComplete}
              />
            </motion.div>
          ) : report ? (
            <motion.div
              key="report"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Report Header */}
              <div className="text-center mb-10">
                {isFeatureMode && scan?.startup_context && (
                  <p className="text-xs text-zinc-600 mb-1">
                    {scan.startup_context}
                  </p>
                )}
                {scan && (
                  <p className="text-sm text-zinc-500 mb-2 max-w-xl mx-auto truncate">
                    {scan.idea}
                  </p>
                )}
                {isFeatureMode && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-500/10 border border-brand-500/20 text-brand-400 mb-4">
                    Feature Validation
                  </span>
                )}
                <div className="flex justify-center mb-6">
                  <ScoreRing
                    score={report.overallScore ?? 0}
                    label={isFeatureMode ? 'Feature Score' : 'Validation Score'}
                  />
                </div>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getConfidenceBadgeColor(
                    report.confidence ?? 'Low'
                  )}`}
                >
                  {report.confidence ?? 'Low'} Confidence
                </span>
              </div>

              {/* Tabs */}
              <div className="flex justify-center mb-8">
                <div className="inline-flex bg-zinc-900/50 border border-zinc-800 rounded-xl p-1">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeTab === tab.id
                          ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {activeTab === 'overview' && (
                    <div className="space-y-8">
                      <DimensionsGrid dimensions={report.dimensions ?? []} />
                      <AiVerdict verdict={report.verdict ?? 'No verdict available.'} />
                    </div>
                  )}
                  {activeTab === 'sources' && (
                    <SourceBreakdown sources={report.sources ?? {}} />
                  )}
                  {activeTab === 'recommendations' && (
                    <Recommendations recommendations={report.recommendations ?? []} />
                  )}
                  {activeTab === 'audience' && report.audienceInsights && (
                    <AudienceIntel insights={report.audienceInsights} />
                  )}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </main>
  );
}
