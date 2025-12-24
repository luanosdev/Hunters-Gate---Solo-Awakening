import React from 'react';

interface ProgressBarProps {
  current: number;
  max: number;
  color: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ current, max, color }) => (
  <div className="w-full h-3 bg-gray-900 rounded-sm border border-gray-700 overflow-hidden relative shadow-[0_0_5px_rgba(0,0,0,0.5)]">
     <div className="absolute inset-0 bg-gray-800/50"></div>
    <div
      className="h-full transition-all duration-200 relative z-10"
      style={{ width: `${Math.max(0, Math.min(100, (current / max) * 100))}%`, backgroundColor: color }}
    />
  </div>
);