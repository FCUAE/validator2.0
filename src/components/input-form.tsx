'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { SOURCE_LIST } from '@/types/report';
import type { ScanMode } from '@/types/report';

const TIMEFRAMES = [
  { value: 7, label: '7 Days' },
  { value: 30, label: '30 Days' },
  { value: 90, label: '90 Days' },
];

const MODES: { value: ScanMode; label: string; description: string }[] = [
  { value: 'idea', label: 'Startup Idea', description: 'Validate a new startup concept' },
  { value: 'feature', label: 'Feature / Tool', description: 'Validate a feature for your startup' },
];

export default function InputForm() {
  const router = useRouter();
  const [mode, setMode] = useState<ScanMode>('idea');
  const [idea, setIdea] = useState('');
  const [startupContext, setStartupContext] = useState('');
  const [audience, setAudience] = useState('');
  const [timeframe, setTimeframe] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isFeatureMode = mode === 'feature';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idea.trim() || !audience.trim()) {
      setError('Please fill in both the idea and target audience.');
      return;
    }
    if (isFeatureMode && !startupContext.trim()) {
      setError('Please describe your existing startup.');
      return;
    }
    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          idea: idea.trim(),
          audience: audience.trim(),
          startupContext: isFeatureMode ? startupContext.trim() : null,
          timeframe,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to start scan');
      }

      const { scanId, cached } = await res.json();

      if (!cached) {
        sessionStorage.setItem(
          `scan_params_${scanId}`,
          JSON.stringify({
            mode,
            idea: idea.trim(),
            audience: audience.trim(),
            startupContext: isFeatureMode ? startupContext.trim() : null,
            timeframe,
          })
        );
      }

      router.push(`/scan/${scanId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsSubmitting(false);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="w-full max-w-2xl mx-auto space-y-6"
    >
      {/* Mode Toggle */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-300">
          What are you validating?
        </label>
        <div className="flex gap-3">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all text-left ${
                mode === m.value
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25'
                  : 'bg-zinc-900/50 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <span className="block">{m.label}</span>
              <span className={`block text-xs mt-0.5 ${mode === m.value ? 'text-brand-200' : 'text-zinc-500'}`}>
                {m.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Startup Context (Feature mode only) */}
      <AnimatePresence>
        {isFeatureMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-2 overflow-hidden"
          >
            <label htmlFor="startup-context" className="block text-sm font-medium text-zinc-300">
              Your Startup
            </label>
            <div className="relative">
              <input
                id="startup-context"
                type="text"
                value={startupContext}
                onChange={(e) => setStartupContext(e.target.value.slice(0, 200))}
                placeholder="e.g., Acme — a project management tool for remote engineering teams"
                className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all"
              />
              <span className="absolute top-1/2 -translate-y-1/2 right-3 text-xs text-zinc-500">
                {startupContext.length}/200
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Idea / Feature Description */}
      <div className="space-y-2">
        <label htmlFor="idea" className="block text-sm font-medium text-zinc-300">
          {isFeatureMode ? 'Describe the Feature / Tool' : 'Describe Your Idea'}
        </label>
        <div className="relative">
          <textarea
            id="idea"
            value={idea}
            onChange={(e) => setIdea(e.target.value.slice(0, 500))}
            placeholder={
              isFeatureMode
                ? 'e.g., AI-powered daily standup summaries that auto-generate status updates from commit history and PR activity.'
                : 'e.g., Virtual residency program for startup founders with mentorship, co-founder matching, and investor access.'
            }
            rows={4}
            className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 resize-none transition-all"
          />
          <span className="absolute bottom-3 right-3 text-xs text-zinc-500">
            {idea.length}/500
          </span>
        </div>
      </div>

      {/* Target Audience */}
      <div className="space-y-2">
        <label htmlFor="audience" className="block text-sm font-medium text-zinc-300">
          Target Audience
        </label>
        <div className="relative">
          <input
            id="audience"
            type="text"
            value={audience}
            onChange={(e) => setAudience(e.target.value.slice(0, 200))}
            placeholder={
              isFeatureMode
                ? 'e.g., Engineering managers, team leads, remote-first companies'
                : 'e.g., First-time startup founders, solo founders, remote tech entrepreneurs'
            }
            className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all"
          />
          <span className="absolute top-1/2 -translate-y-1/2 right-3 text-xs text-zinc-500">
            {audience.length}/200
          </span>
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-300">
          Analysis Timeframe
        </label>
        <div className="flex gap-3">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              type="button"
              onClick={() => setTimeframe(tf.value)}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all ${
                timeframe === tf.value
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25'
                  : 'bg-zinc-900/50 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Source Grid */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-zinc-300">
          Platforms We&apos;ll Scan
        </label>
        <div className="grid grid-cols-4 gap-2">
          {SOURCE_LIST.map((source) => (
            <div
              key={source.id}
              className="flex items-center gap-2 px-3 py-2 bg-zinc-900/30 border border-zinc-800/50 rounded-lg text-xs text-zinc-400"
            >
              <span className="text-base">{source.icon}</span>
              <span>{source.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
        >
          {error}
        </motion.div>
      )}

      {/* Submit */}
      <motion.button
        type="submit"
        disabled={isSubmitting || !idea.trim() || !audience.trim() || (isFeatureMode && !startupContext.trim())}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-4 px-6 bg-gradient-to-r from-brand-600 to-brand-500 text-white font-semibold rounded-xl shadow-lg shadow-brand-600/25 hover:shadow-brand-600/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-lg"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Starting Scan...
          </span>
        ) : isFeatureMode ? (
          'Validate Feature'
        ) : (
          'Run Validation Scan'
        )}
      </motion.button>
    </motion.form>
  );
}
