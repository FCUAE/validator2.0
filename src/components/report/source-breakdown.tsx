'use client';

import { motion } from 'framer-motion';
import type { SourceScore } from '@/types/report';
import { SOURCE_LIST } from '@/types/report';
import { getScoreColor, getSentimentColor } from '@/lib/utils';

interface SourceBreakdownProps {
  sources: Record<string, SourceScore>;
}

export default function SourceBreakdown({ sources }: SourceBreakdownProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {SOURCE_LIST.map((sourceInfo, index) => {
        const data = sources[sourceInfo.id];
        const isAvailable = data && data.score > 0;

        return (
          <motion.div
            key={sourceInfo.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className={`glass-card rounded-xl p-5 ${
              !isAvailable ? 'opacity-50' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{sourceInfo.icon}</span>
                <h4 className="font-medium text-zinc-200">{sourceInfo.name}</h4>
              </div>
              {isAvailable ? (
                <span className={`text-xl font-bold tabular-nums ${getScoreColor(data.score)}`}>
                  {data.score}
                </span>
              ) : (
                <span className="text-xs text-zinc-600 bg-zinc-800 px-2 py-1 rounded">
                  Unavailable
                </span>
              )}
            </div>

            {isAvailable ? (
              <>
                <div className="flex items-center gap-3 mb-3 text-xs">
                  <span className={getSentimentColor(data.sentiment)}>
                    {data.sentiment}
                  </span>
                  <span className="text-zinc-600">|</span>
                  <span className="text-zinc-400">
                    {data.signalCount} signals
                  </span>
                  <span className="text-zinc-600">|</span>
                  {data.trending ? (
                    <span className="text-green-400 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                      Trending
                    </span>
                  ) : (
                    <span className="text-zinc-500">Stable</span>
                  )}
                </div>
                <p className="text-sm text-zinc-400">{data.summary}</p>
              </>
            ) : (
              <p className="text-sm text-zinc-600">
                No data available from this source for this scan.
              </p>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
