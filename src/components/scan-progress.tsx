'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SOURCE_LIST } from '@/types/report';

interface ScanProgressProps {
  scanId: string;
  onComplete: () => void;
}

interface ScanStatus {
  status: 'pending' | 'scanning' | 'completed' | 'failed';
  progress: number;
  current_source: string | null;
}

export default function ScanProgress({ scanId, onComplete }: ScanProgressProps) {
  const [status, setStatus] = useState<ScanStatus>({
    status: 'pending',
    progress: 0,
    current_source: null,
  });
  const [completedSources, setCompletedSources] = useState<Set<string>>(new Set());
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [error, setError] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startTimeRef = useRef(Date.now());

  // Elapsed time counter
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const onCompleteStable = useCallback(onComplete, [onComplete]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const poll = async () => {
      try {
        const res = await fetch(`/api/scan/${scanId}`);
        if (!res.ok) throw new Error('Failed to fetch scan status');
        const data: ScanStatus = await res.json();
        setStatus(data);

        // Parse completed sources from current_source field
        if (data.current_source) {
          if (data.current_source === 'ai_synthesis') {
            // All sources done, AI is synthesizing
            setCompletedSources(new Set(SOURCE_LIST.map((s) => s.id)));
            setIsSynthesizing(true);
          } else {
            // current_source is a comma-separated list of completed source IDs
            const ids = data.current_source.split(',').filter(Boolean);
            setCompletedSources(new Set(ids));
          }
        }

        if (data.status === 'completed') {
          setCompletedSources(new Set(SOURCE_LIST.map((s) => s.id)));
          setIsSynthesizing(false);
          clearInterval(interval);
          setTimeout(onCompleteStable, 800);
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setError('Scan failed. Please try again.');
        }
      } catch {
        // Continue polling on error
      }
    };

    poll();
    interval = setInterval(poll, 1500);

    return () => clearInterval(interval);
  }, [scanId, onCompleteStable]);

  const getSourceStatus = (sourceId: string): 'pending' | 'scanning' | 'complete' => {
    if (completedSources.has(sourceId)) return 'complete';
    if (status.status === 'completed') return 'complete';
    // Show a "scanning" spinner on the next uncompleted source to indicate activity
    if (status.status === 'scanning' && !isSynthesizing) {
      const firstPending = SOURCE_LIST.find((s) => !completedSources.has(s.id));
      if (firstPending && firstPending.id === sourceId) return 'scanning';
    }
    return 'pending';
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const completedCount = completedSources.size;
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
              : `${completedCount} of ${totalSources} sources scanned`}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-zinc-500 text-xs font-mono">{formatTime(elapsedSeconds)}</span>
            <span className="text-brand-400 font-mono">{status.progress}%</span>
          </div>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${status.progress}%` }}
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
                    : 'bg-zinc-900/30 border-zinc-800/50'
                }`}
              >
                <span className="text-xl">{source.icon}</span>
                <span className={`flex-1 text-sm font-medium ${
                  sourceStatus === 'complete'
                    ? 'text-green-300'
                    : sourceStatus === 'scanning'
                    ? 'text-brand-300'
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

function StatusIndicator({ status }: { status: 'pending' | 'scanning' | 'complete' }) {
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
