'use client';

import { motion } from 'framer-motion';
import type { ValidationDimension } from '@/types/report';
import { getScoreColor } from '@/lib/utils';

interface DimensionsGridProps {
  dimensions: ValidationDimension[];
}

export default function DimensionsGrid({ dimensions }: DimensionsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {dimensions.map((dim, index) => (
        <motion.div
          key={dim.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="glass-card rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-zinc-300">{dim.name}</h4>
            <span className={`text-lg font-bold tabular-nums ${getScoreColor(dim.score)}`}>
              {dim.score}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-3">
            <motion.div
              className={`h-full rounded-full ${
                dim.score >= 75
                  ? 'bg-green-500'
                  : dim.score >= 50
                  ? 'bg-yellow-500'
                  : dim.score >= 25
                  ? 'bg-orange-500'
                  : 'bg-red-500'
              }`}
              initial={{ width: '0%' }}
              animate={{ width: `${dim.score}%` }}
              transition={{ duration: 1, delay: 0.3 + index * 0.1 }}
            />
          </div>

          <p className="text-xs text-zinc-500">{dim.detail}</p>
          <span className="inline-block mt-2 text-[10px] text-zinc-600 font-mono">
            Weight: {Math.round(dim.weight * 100)}%
          </span>
        </motion.div>
      ))}
    </div>
  );
}
