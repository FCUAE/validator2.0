'use client';

import { motion } from 'framer-motion';
import type { AudienceInsights } from '@/types/report';

interface AudienceIntelProps {
  insights: AudienceInsights;
}

export default function AudienceIntel({ insights }: AudienceIntelProps) {
  return (
    <div className="space-y-6">
      {/* Primary Demographic */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl p-6"
      >
        <h4 className="text-sm font-medium text-zinc-400 mb-2">Primary Demographic</h4>
        <p className="text-lg text-zinc-200">{insights.primaryDemographic}</p>
      </motion.div>

      {/* Pain Points */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-xl p-6"
      >
        <h4 className="text-sm font-medium text-zinc-400 mb-4">Top Pain Points</h4>
        <div className="space-y-3">
          {(insights.topPainPoints ?? []).map((point, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.08 }}
              className="flex items-start gap-3"
            >
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-xs text-red-400 font-mono">
                {index + 1}
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">{point}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Content Gaps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-xl p-6"
      >
        <h4 className="text-sm font-medium text-zinc-400 mb-2">Content Gaps &amp; Opportunities</h4>
        <p className="text-xs text-zinc-500 mb-4">
          Topics your audience is searching for but not finding good answers to
        </p>
        <div className="flex flex-wrap gap-2">
          {(insights.contentGaps ?? []).map((gap, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.08 }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-500/10 border border-brand-500/20 rounded-lg text-sm text-brand-300"
            >
              <svg className="w-3 h-3 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              {gap}
            </motion.span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
