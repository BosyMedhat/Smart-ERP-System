import { Pause, Play, Square, Bot } from 'lucide-react';
import type { DemoState } from '../hooks/useAIDemoMode';

interface AIDemoControlsProps {
  demoState: DemoState;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export function AIDemoControls({ demoState, onPause, onResume, onStop }: AIDemoControlsProps) {
  const { status, currentStepIndex, totalSteps } = demoState;

  if (status === 'idle' || status === 'completed') return null;

  const progress = Math.round(((currentStepIndex + 1) / totalSteps) * 100);

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2"
      dir="rtl"
      style={{ pointerEvents: 'auto' }}
    >
      {/* Main pill */}
      <div className="flex items-center gap-3 bg-gray-900/95 backdrop-blur-md border border-blue-500/40 rounded-2xl px-4 py-2.5 shadow-2xl">
        {/* Animated indicator */}
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
              status === 'running'
                ? 'bg-blue-400 animate-pulse'
                : 'bg-amber-400'
            }`}
          />
          <Bot size={16} className="text-blue-400 flex-shrink-0" />
          <span className="text-white text-xs font-semibold whitespace-nowrap">
            {status === 'running' ? 'عرض ذكي جارٍ' : 'عرض ذكي — متوقف'}
          </span>
        </div>

        {/* Step counter */}
        <div className="text-blue-300 text-xs font-mono bg-blue-500/20 px-2 py-0.5 rounded-lg whitespace-nowrap">
          {currentStepIndex + 1} / {totalSteps}
        </div>

        {/* Divider */}
        <div className="w-px h-4 bg-white/20" />

        {/* Controls */}
        <div className="flex items-center gap-1">
          {status === 'running' ? (
            <button
              type="button"
              onClick={onPause}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold transition-all"
              title="إيقاف مؤقت"
            >
              <Pause size={13} />
              إيقاف مؤقت
            </button>
          ) : (
            <button
              type="button"
              onClick={onResume}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all"
              title="استمرار"
            >
              <Play size={13} />
              استمرار
            </button>
          )}
          <button
            type="button"
            onClick={onStop}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-semibold transition-all"
            title="إيقاف العرض"
          >
            <Square size={13} />
            إيقاف
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
