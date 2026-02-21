'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export default function ScoreRing({ score, size = 200, strokeWidth = 12, label }: ScoreRingProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = score / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setDisplayScore(score);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.round(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [score]);

  const getColor = () => {
    if (score >= 75) return { stroke: '#22c55e', glow: 'rgba(34, 197, 94, 0.3)' };
    if (score >= 50) return { stroke: '#eab308', glow: 'rgba(234, 179, 8, 0.3)' };
    if (score >= 25) return { stroke: '#f97316', glow: 'rgba(249, 115, 22, 0.3)' };
    return { stroke: '#ef4444', glow: 'rgba(239, 68, 68, 0.3)' };
  };

  const color = getColor();

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />
        {/* Score circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          style={{
            filter: `drop-shadow(0 0 8px ${color.glow})`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-5xl font-bold tabular-nums"
          style={{ color: color.stroke }}
        >
          {displayScore}
        </span>
        {label && <span className="text-sm text-zinc-400 mt-1">{label}</span>}
      </div>
    </div>
  );
}
