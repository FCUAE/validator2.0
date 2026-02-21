'use client';

import { useEffect, useState } from 'react';
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
  const [error, setError] = useState('');

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let previousSource: string | null = null;

    const poll = async () => {
      try {
        const res = await fetch(`/api/scan/${scanId}`);
        if (!res.ok) throw new Error('Failed to fetch scan status');
        const data: ScanStatus = await res.json();
        setStatus(data);

        // Track completed sources
        if (data.current_source && data.current_source !== previousSource && previousSource) {
          setCompletedSources((prev) => new Set([...prev, previousSource!]));
        }
        previousSource = data.current_source;

        if (data.status === 'completed') {
          // Mark all as complete
          setCompletedSources(new Set(SOURCE_LIST.map((s) => s.id)));
          clearInterval(interval);
          setTimeout(onComplete, 1000);
        } else if (data.status === 'failed') {
          clearInterval(interval);
          setError('Scan failed. Please try again.');
        }
      } catch {
        // Continue polling on error
      }
    };

    poll();
    interval = setInterval(poll, 2000);

    return () => clearInterval(interval);
  }, [scanId, onComplete]);

  const getSourceStatus = (sourceId: string) => {
    if (completedSources.has(sourceId)) return 'complete';
    if (status.current_source === sourceId) return 'scanning';
    if (status.status === 'completed') return 'complete';
    return 'pending';
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl font-bold mb-2">Scanning Platforms</h2>
        <p className="text-zinc-400">
          Analyzing sentiment and demand signals across the web...
        </p>
      </motion.div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-zinc-400">Progress</span>
          <span className="text-brand-400 font-mono">{status.progress}%</span>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <AnimatePresence>
          {SOURCE_LIST.map((source, index) => {
            const sourceStatus = getSourceStatus(source.id);
            return (
              <motion.div
                key={source.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                  sourceStatus === 'scanning'
                    ? 'bg-brand-500/10 border-brand-500/30'
                    : sourceStatus === 'complete'
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-zinc-900/30 border-zinc-800/50'
                }`}
              >
                <span className="text-xl">{source.icon}</span>
                <span className="flex-1 text-sm font-medium text-zinc-300">
                  {source.name}
                </span>
                <StatusIndicator status={sourceStatus} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-center"
        >
          {error}
        </motion.div>
      )}

      {/* Current Source Info */}
      {status.current_source && (
        <motion.p
          key={status.current_source}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 text-center text-sm text-zinc-500"
        >
          Currently scanning:{' '}
          <span className="text-brand-400">
            {SOURCE_LIST.find((s) => s.id === status.current_source)?.name || status.current_source}
          </span>
        </motion.p>
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
