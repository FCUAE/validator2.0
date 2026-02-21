'use client';

import { motion } from 'framer-motion';

interface AiVerdictProps {
  verdict: string;
}

export default function AiVerdict({ verdict }: AiVerdictProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-card rounded-xl p-6 relative overflow-hidden"
    >
      {/* AI Indicator */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-600 via-purple-500 to-brand-400" />

      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center">
          <svg className="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white">AI Verdict</h3>
      </div>

      <p className="text-zinc-300 leading-relaxed whitespace-pre-line">
        {verdict}
      </p>
    </motion.div>
  );
}
