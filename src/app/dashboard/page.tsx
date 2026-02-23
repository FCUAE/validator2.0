'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { Scan } from '@/types/report';
import { getScoreColor, formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScans();
  }, []);

  async function fetchScans() {
    try {
      const res = await fetch('/api/dashboard/scans');
      if (res.ok) {
        const data = await res.json();
        setScans(data.scans || []);
      }
    } catch {
      // silently fail
    }
    setLoading(false);
  }

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
          <div className="flex items-center gap-4">
            <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full border border-amber-500/30">
              Admin Mode
            </span>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-zinc-500 mt-1">All validation scans</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchScans}
              className="inline-flex items-center gap-2 px-4 py-2 text-zinc-400 text-sm border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Scan
            </a>
          </div>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          <div className="glass-card rounded-xl p-5">
            <p className="text-xs text-zinc-500 mb-1">Total Scans</p>
            <p className="text-2xl font-bold tabular-nums">{scans.length}</p>
          </div>
          <div className="glass-card rounded-xl p-5">
            <p className="text-xs text-zinc-500 mb-1">Completed</p>
            <p className="text-2xl font-bold tabular-nums text-green-400">
              {scans.filter((s) => s.status === 'completed').length}
            </p>
          </div>
          <div className="glass-card rounded-xl p-5">
            <p className="text-xs text-zinc-500 mb-1">Avg Score</p>
            <p className="text-2xl font-bold tabular-nums text-brand-400">
              {scans.filter((s) => s.report).length > 0
                ? Math.round(
                    scans
                      .filter((s) => s.report)
                      .reduce((sum, s) => sum + (s.report?.overallScore || 0), 0) /
                      scans.filter((s) => s.report).length
                  )
                : '-'}
            </p>
          </div>
        </motion.div>

        {/* Scans List */}
        {scans.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center py-20"
          >
            <p className="text-zinc-500 mb-2">No scans yet.</p>
            <p className="text-zinc-600 text-sm">Run your first validation scan to see it here.</p>
            <a
              href="/"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 text-brand-400 text-sm hover:text-brand-300 transition-colors"
            >
              Get Started
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {scans.map((scan, index) => (
              <motion.a
                key={scan.id}
                href={`/scan/${scan.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="block glass-card rounded-xl p-5 hover:bg-white/[0.04] transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-zinc-200 truncate group-hover:text-white transition-colors">
                      {scan.idea}
                    </h4>
                    <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                      {scan.mode === 'feature' && (
                        <>
                          <span className="text-brand-400 font-medium">Feature</span>
                          <span className="text-zinc-700">|</span>
                        </>
                      )}
                      <span>{formatDate(scan.created_at)}</span>
                      <span className="text-zinc-700">|</span>
                      <span>{scan.timeframe} day analysis</span>
                      <span className="text-zinc-700">|</span>
                      <span
                        className={
                          scan.status === 'completed'
                            ? 'text-green-400'
                            : scan.status === 'failed'
                            ? 'text-red-400'
                            : 'text-yellow-400'
                        }
                      >
                        {scan.status}
                      </span>
                      <span className="text-zinc-700">|</span>
                      <span className="font-mono text-zinc-600">{scan.id.slice(0, 8)}</span>
                    </div>
                  </div>
                  {scan.report && (
                    <div className="ml-4 flex-shrink-0">
                      <span
                        className={`text-2xl font-bold tabular-nums ${getScoreColor(
                          scan.report.overallScore
                        )}`}
                      >
                        {scan.report.overallScore}
                      </span>
                    </div>
                  )}
                </div>
              </motion.a>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
