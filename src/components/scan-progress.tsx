'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SOURCE_LIST } from '@/types/report';
import type { ValidationReport } from '@/types/report';

interface ScanProgressProps {
  scanId: string;
  idea?: string;
  audience?: string;
  timeframe?: number;
  onComplete: (report: ValidationReport) => void;
}

export default function ScanProgress({
  scanId,
  idea,
  audience,
  timeframe,
  onComplete,
}: ScanProgressProps) {
  const [completedSources, setCompletedSources] = useState<Set<string>>(new Set());
  const [failedSources, setFailedSources] = useState<Set<string>>(new Set());
  const [activeScanningSource, setActiveScanningSource] = useState<string | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startTimeRef = useRef(Date.now());
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  // Track completed/failed source IDs across SSE events (avoids stale closure issues)
  const completedIdsRef = useRef<Set<string>>(new Set());
  const failedIdsRef = useRef<Set<string>>(new Set());

  // Elapsed time counter
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Connect to SSE streaming endpoint
  useEffect(() => {
    if (!idea || !audience) {
      setError('Missing scan parameters. Please start a new scan.');
      return;
    }

    const abortController = new AbortController();

    async function runStreamingScan() {
      try {
        setProgress(2);

        const response = await fetch(`/api/scan/${scanId}/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idea, audience, timeframe: timeframe ?? 30 }),
          signal: abortController.signal,
        });

        if (!response.ok || !response.body) {
          setError('Failed to start scan. Please try again.');
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE events (delimited by double newlines)
          const parts = buffer.split('\n\n');
          buffer = parts.pop() || '';

          for (const part of parts) {
            const line = part.trim();
            if (!line.startsWith('data: ')) continue;

            try {
              const data = JSON.parse(line.slice(6));

              switch (data.type) {
                case 'started':
                  setProgress(5);
                  break;

                case 'source_complete': {
                  const sourceId = data.sourceId as string;
                  const available = data.available as boolean;

                  if (available) {
                    completedIdsRef.current.add(sourceId);
                    setCompletedSources(new Set(completedIdsRef.current));
                  } else {
                    failedIdsRef.current.add(sourceId);
                    setFailedSources(new Set(failedIdsRef.current));
                  }

                  const completedCount = data.completedCount as number;
                  const total = data.totalSources as number;

                  // Find first still-pending source for the spinner
                  const allDone = new Set([...completedIdsRef.current, ...failedIdsRef.current]);
                  const nextPending = SOURCE_LIST.find(
                    (s) => !allDone.has(s.id)
                  );
                  setActiveScanningSource(nextPending?.id ?? null);

                  const pct = Math.round((completedCount / total) * 70) + 5;
                  setProgress(pct);
                  break;
                }

                case 'synthesizing':
                  setIsSynthesizing(true);
                  setActiveScanningSource(null);
                  setProgress(80);
                  break;

                case 'complete': {
                  setProgress(100);
                  setIsSynthesizing(false);
                  // Brief delay for the 100% animation to show
                  setTimeout(() => {
                    onCompleteRef.current(data.report as ValidationReport);
                  }, 800);
                  break;
                }

                case 'error':
                  setError(data.message || 'Scan failed. Please try again.');
                  break;
              }
            } catch {
              // Skip malformed SSE events
            }
          }
        }
      } catch (err: unknown) {
        if (abortController.signal.aborted) return;
        const message =
          err instanceof Error ? err.message : 'Connection lost';
        setError(`${message}. Please refresh and try again.`);
      }
    }

    runStreamingScan();
    return () => abortController.abort();
  }, [scanId, idea, audience, timeframe]);

  const getSourceStatus = (sourceId: string): 'pending' | 'scanning' | 'complete' | 'failed' => {
    if (completedSources.has(sourceId)) return 'complete';
    if (failedSources.has(sourceId)) return 'failed';
    if (activeScanningSource === sourceId) return 'scanning';
    // If no specific active source is set but we're scanning, show the first pending as scanning
    if (!activeScanningSource && !isSynthesizing && progress > 0 && progress < 75) {
      const allDone = new Set([...completedSources, ...failedSources]);
      const firstPending = SOURCE_LIST.find((s) => !allDone.has(s.id));
      if (firstPending && firstPending.id === sourceId) return 'scanning';
    }
    return 'pending';
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const successCount = completedSources.size;
  const failCount = failedSources.size;
  const doneCount = successCount + failCount;
  const totalSources = SOURCE_LIST.length;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold mb-2">
          {isSynthesizing ? 'Analyzing Results' : 'Scanning Platforms'}
        </h2>
        <p className="text-zinc-400">
          {isSynthesizing
            ? 'AI is synthesizing insights from all sources...'
            : `Checking ${totalSources} platforms for demand signals and sentiment...`}
        </p>
      </motion.div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-zinc-400">
            {isSynthesizing
              ? 'AI Synthesis'
              : `${doneCount} of ${totalSources} sources scanned${failCount > 0 ? ` (${failCount} unavailable)` : ''}`}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-zinc-500 text-xs font-mono">{formatTime(elapsedSeconds)}</span>
            <span className="text-brand-400 font-mono">{progress}%</span>
          </div>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Source Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <AnimatePresence>
          {SOURCE_LIST.map((source, index) => {
            const sourceStatus = getSourceStatus(source.id);
            return (
              <motion.div
                key={source.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300 ${
                  sourceStatus === 'scanning'
                    ? 'bg-brand-500/10 border-brand-500/30'
                    : sourceStatus === 'complete'
                    ? 'bg-green-500/10 border-green-500/30'
                    : sourceStatus === 'failed'
                    ? 'bg-amber-500/5 border-amber-500/20'
                    : 'bg-zinc-900/30 border-zinc-800/50'
                }`}
              >
                <span className="text-xl">{source.icon}</span>
                <span className={`flex-1 text-sm font-medium ${
                  sourceStatus === 'complete'
                    ? 'text-green-300'
                    : sourceStatus === 'scanning'
                    ? 'text-brand-300'
                    : sourceStatus === 'failed'
                    ? 'text-amber-400/70'
                    : 'text-zinc-500'
                }`}>
                  {source.name}
                </span>
                <StatusIndicator status={sourceStatus} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* AI Synthesis Phase */}
      {isSynthesizing && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-4 rounded-xl border bg-brand-500/5 border-brand-500/20 mb-6"
        >
          <div className="w-6 h-6 rounded-full border-2 border-brand-400 border-t-transparent animate-spin" />
          <div className="flex-1">
            <p className="text-sm font-medium text-brand-300">AI Synthesis in progress</p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Claude is analyzing patterns across all sources to generate your report...
            </p>
          </div>
        </motion.div>
      )}

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center"
        >
          {error}
        </motion.div>
      )}
    </div>
  );
}

function StatusIndicator({ status }: { status: 'pending' | 'scanning' | 'complete' | 'failed' }) {
  switch (status) {
    case 'complete':
      return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center"
        >
          <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </motion.div>
      );
    case 'failed':
      return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-5 h-5 rounded-full bg-amber-500/15 flex items-center justify-center"
        >
          <svg className="w-3 h-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" />
          </svg>
        </motion.div>
      );
    case 'scanning':
      return (
        <div className="w-5 h-5 rounded-full border-2 border-brand-400 border-t-transparent animate-spin" />
      );
    default:
      return (
        <div className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700" />
      );
  }
}
