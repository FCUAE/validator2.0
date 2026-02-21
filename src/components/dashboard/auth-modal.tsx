'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { createBrowserClient } from '@/lib/supabase-client';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const supabase = createBrowserClient();

      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage('Check your email for a confirmation link.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-lg bg-brand-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="font-bold text-xl">ValidateIQ</span>
          </a>
          <h2 className="text-xl font-semibold">
            {isSignUp ? 'Create an Account' : 'Welcome Back'}
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            {isSignUp
              ? 'Sign up to save your scans and track progress'
              : 'Sign in to access your dashboard'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card rounded-xl p-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all"
              placeholder="Minimum 6 characters"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-brand-600 text-white font-medium rounded-xl hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setMessage('');
              }}
              className="text-sm text-zinc-400 hover:text-brand-400 transition-colors"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </div>
        </form>

        <div className="text-center mt-4">
          <button
            onClick={onClose}
            className="text-sm text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            Continue without signing in
          </button>
        </div>
      </motion.div>
    </div>
  );
}
