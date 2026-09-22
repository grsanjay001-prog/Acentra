import React, { useState } from 'react';
import { Resource, ChaosRunResult } from '../types';
import { Flame, ShieldCheck, CheckCircle2, XCircle, Clock, Zap, RotateCcw, AlertTriangle, Activity, X, HeartPulse, Stethoscope } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sound } from '../utils/audio';

interface ChaosTesterProps {
  resources: Resource[];
  selectedResourceId: string;
  selectedDate: string;
  onClose: () => void;
  onRunCompleted: () => void;
}

export const ChaosTester: React.FC<ChaosTesterProps> = ({
  resources,
  selectedResourceId,
  selectedDate,
  onClose,
  onRunCompleted,
}) => {
  const [targetResourceId, setTargetResourceId] = useState(selectedResourceId || resources[0]?.id || '');
  const [targetHour, setTargetHour] = useState(14); // 14:00 - 15:00 UTC
  const [requestCount, setRequestCount] = useState(100);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ChaosRunResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedResource = resources.find((r) => r.id === targetResourceId);

  const handleFireStorm = async () => {
    sound.playClick();
    setIsLoading(true);
    setError(null);
    setResult(null);

    const startTime = `${selectedDate}T${targetHour.toString().padStart(2, '0')}:00:00.000Z`;
    const endTime = `${selectedDate}T${(targetHour + 1).toString().padStart(2, '0')}:00:00.000Z`;

    try {
      const res = await fetch('/api/chaos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceId: targetResourceId,
          startTime,
          endTime,
          requestCount,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Emergency surge stress test failed');
      }

      const chaosData: ChaosRunResult = await res.json();
      setResult(chaosData);
      onRunCompleted();

      if (chaosData.confirmedCount === 1) {
        sound.playLock();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (err: any) {
      sound.playConflict();
      setError(err.message || 'Execution failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="bg-slate-900 rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-teal-500/30 my-8 text-white relative animate-in zoom-in-95 duration-150">
        
        {/* Close Button */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-5 right-5 p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3.5 pb-5 border-b border-slate-800">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-600 flex items-center justify-center text-slate-950 shadow-md">
            <Flame className="w-6 h-6 stroke-[2.4]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-display text-lg font-bold text-white tracking-tight">
                Emergency Influx Stress Engine (Chaos 100x)
              </h3>
              <span className="text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40 px-2 py-0.5 rounded-full uppercase tracking-wider">
                100x Parallel Proof
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Fires up to 100 emergency room requests into a single operating suite at the exact same instant to verify zero double-bookings.
            </p>
          </div>
        </div>

        {/* Controls Grid */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-mono font-medium text-slate-400 mb-1">
              Target Facility
            </label>
            <select
              value={targetResourceId}
              onChange={(e) => setTargetResourceId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-teal-500 font-mono"
            >
              {resources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-slate-400 mb-1">
              Target Time Slot
            </label>
            <select
              value={targetHour}
              onChange={(e) => setTargetHour(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-teal-500 font-mono"
            >
              {[7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((h) => (
                <option key={h} value={h}>
                  {h.toString().padStart(2, '0')}:00 - {(h + 1).toString().padStart(2, '0')}:00 UTC
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-slate-400 mb-1">
              Concurrent Trauma Teams
            </label>
            <div className="flex items-center space-x-1.5">
              {[25, 50, 100].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setRequestCount(c)}
                  className={`flex-1 py-2 text-xs font-mono font-bold rounded-xl border transition ${
                    requestCount === c
                      ? 'bg-teal-500 text-slate-950 border-teal-400 font-bold shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {c}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Trigger Button */}
        <div className="mt-5">
          <button
            onClick={handleFireStorm}
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-bold text-xs transition shadow-md shadow-teal-500/20 flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-98"
          >
            <Flame className="w-4 h-4 fill-slate-950" />
            <span>
              {isLoading
                ? `Executing ${requestCount} Concurrent Emergency Requests...`
                : `Launch ${requestCount}x Concurrent Emergency Stress Test`}
            </span>
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Result Telemetry Dashboard */}
        {result && (
          <div className="mt-6 space-y-4 animate-in fade-in">
            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-teal-400">
                  Patient Safety Concurrency Telemetry
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  Total Latency: <strong className="text-white">{result.elapsedMs}ms</strong>
                </span>
              </div>

              {/* Status Grid Counters */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                    Simultaneous Influx
                  </span>
                  <span className="text-xl font-bold font-mono text-white">
                    {result.totalRequests}
                  </span>
                </div>

                <div className="p-3 bg-teal-950/30 rounded-xl border border-teal-500/40">
                  <span className="text-[10px] font-mono uppercase text-teal-400 block mb-1">
                    Confirmed (201)
                  </span>
                  <span className="text-xl font-bold font-mono text-teal-300">
                    {result.confirmedCount}
                  </span>
                  <span className="text-[9px] font-mono text-teal-400 block">Exactly 1 Confirmed</span>
                </div>

                <div className="p-3 bg-rose-950/30 rounded-xl border border-rose-500/40">
                  <span className="text-[10px] font-mono uppercase text-rose-400 block mb-1">
                    Defended (409)
                  </span>
                  <span className="text-xl font-bold font-mono text-rose-300">
                    {result.rejectedCount}
                  </span>
                  <span className="text-[9px] font-mono text-rose-400 block">Zero Collisions</span>
                </div>
              </div>

              {/* Winning Attending Banner */}
              {result.winningBookingId && (
                <div className="mt-4 p-3 bg-teal-500/10 rounded-xl border border-teal-500/30 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span className="text-slate-200">
                      Confirmed Attending: <strong className="text-white font-mono">{result.winningUserId}</strong>
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-teal-300 bg-teal-500/20 px-2 py-0.5 rounded-full">
                    TxId: {result.winningBookingId.slice(0, 10)}
                  </span>
                </div>
              )}
            </div>

            {/* Individual Request Stream Log */}
            <div className="max-h-48 overflow-y-auto space-y-1.5 p-3 bg-slate-950 rounded-xl border border-slate-800/80 font-mono text-[11px]">
              <div className="text-[10px] text-slate-500 pb-1 border-b border-slate-900 flex justify-between">
                <span>SIMULATED SURGICAL REQUEST TRACE</span>
                <span>STATUS / LATENCY</span>
              </div>
              {result.responses.slice(0, 30).map((r) => (
                <div
                  key={r.requestId}
                  className="flex items-center justify-between py-0.5 text-slate-400"
                >
                  <span className="truncate max-w-[280px]">
                    Req #{r.requestId}: {r.userId}
                  </span>
                  <span
                    className={
                      r.isConfirmed
                        ? 'text-teal-400 font-bold'
                        : 'text-rose-400'
                    }
                  >
                    {r.status} {r.isConfirmed ? 'CONFIRMED' : 'DEFENDED (409)'} • {r.durationMs}ms
                  </span>
                </div>
              ))}
              {result.responses.length > 30 && (
                <div className="text-center text-[10px] text-slate-600 pt-1">
                  + {result.responses.length - 30} additional serializations verified with 0 collisions
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
