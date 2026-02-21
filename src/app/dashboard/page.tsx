'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { createBrowserClient } from '@/lib/supabase-client';
import type { Scan, UserProfile } from '@/types/report';
import { PLAN_LIMITS } from '@/types/report';
import { getScoreColor, formatDate } from '@/lib/utils';
import AuthModal from '@/components/dashboard/auth-modal';

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const supabase = createBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setIsAuthenticated(true);
        // Fetch user profile and scans
        const [profileRes, scansRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', session.user.id).single(),
          supabase.from('scans').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }),
        ]);
        if (profileRes.data) setUser(profileRes.data as UserProfile);
        if (scansRes.data) setScans(scansRes.data as Scan[]);
      } else {
        setShowAuth(true);
      }
    } catch {
      setShowAuth(true);
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

  if (showAuth && !isAuthenticated) {
    return <AuthModal onClose={() => setShowAuth(false)} onSuccess={checkAuth} />;
  }

  const planLimit = user ? PLAN_LIMITS[user.plan] : PLAN_LIMITS.free;

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
            {user && (
              <span className="text-xs text-zinc-500">
                {user.email}
              </span>
            )}
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
            <p className="text-sm text-zinc-500 mt-1">Your validation scan history</p>
          </div>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-xl hover:bg-brand-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Scan
          </a>
        </motion.div>

        {/* Usage Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-xl p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-zinc-400">Scan Usage</h3>
            <span className="text-xs px-2 py-0.5 bg-brand-500/20 text-brand-400 rounded-full border border-brand-500/30 capitalize">
              {user?.plan || 'free'} Plan
            </span>
          </div>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-3xl font-bold tabular-nums">
              {user?.scans_this_month || 0}
            </span>
            <span className="text-zinc-500 text-sm mb-1">
              / {planLimit.scansPerMonth === 999999 ? 'Unlimited' : planLimit.scansPerMonth} scans this month
            </span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all"
              style={{
                width: `${Math.min(100, ((user?.scans_this_month || 0) / planLimit.scansPerMonth) * 100)}%`,
              }}
            />
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
            <p className="text-zinc-500">No scans yet. Run your first validation scan.</p>
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
                      <span>{formatDate(scan.created_at)}</span>
                      <span className="text-zinc-700">|</span>
                      <span>{scan.timeframe} day analysis</span>
                      <span className="text-zinc-700">|</span>
                      <span className={
                        scan.status === 'completed'
                          ? 'text-green-400'
                          : scan.status === 'failed'
                          ? 'text-red-400'
                          : 'text-yellow-400'
                      }>
                        {scan.status}
                      </span>
                    </div>
                  </div>
                  {scan.report && (
                    <div className="ml-4 flex-shrink-0">
                      <span className={`text-2xl font-bold tabular-nums ${getScoreColor(scan.report.overallScore)}`}>
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
