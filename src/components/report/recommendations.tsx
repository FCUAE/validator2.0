'use client';

import { motion } from 'framer-motion';
import type { Recommendation } from '@/types/report';
import { getTypeColor, getScoreColor } from '@/lib/utils';

interface RecommendationsProps {
  recommendations: Recommendation[];
}

export default function Recommendations({ recommendations }: RecommendationsProps) {
  return (
    <div className="space-y-4">
      {recommendations.map((rec, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="glass-card rounded-xl p-5"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${getTypeColor(
                  rec.type
                )}`}
              >
                {rec.type.charAt(0).toUpperCase() + rec.type.slice(1)}
              </span>
              <h4 className="font-semibold text-zinc-200">{rec.title}</h4>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`text-sm font-bold tabular-nums ${getScoreColor(rec.confidence)}`}>
                {rec.confidence}
              </span>
              <span className="text-xs text-zinc-500">confidence</span>
            </div>
          </div>

          <p className="text-sm text-zinc-400 mb-3">{rec.description}</p>

          <div className="flex flex-wrap gap-1.5">
            {(rec.sources ?? []).map((source) => (
              <span
                key={source}
                className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700/50"
              >
                {source}
              </span>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
