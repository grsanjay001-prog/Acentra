import React, { useState } from 'react';
import { Resource } from '../types';
import { Repeat, CheckCircle, ShieldCheck, ArrowRight, RotateCw, AlertCircle, Copy, Terminal, X, Check, HeartPulse } from 'lucide-react';
import { sound } from '../utils/audio';

interface IdempotencyDemoProps {
  resources: Resource[];
  selectedDate: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const IdempotencyDemo: React.FC<IdempotencyDemoProps> = ({
  resources,
  selectedDate,
  onClose,
  onSuccess,
}) => {
  const [selectedResourceId, setSelectedResourceId] = useState(resources[0]?.id || '');
  const [hour, setHour] = useState(11);
  const [idempotencyKey, setIdempotencyKey] = useState(`ehr-pac-${Date.now().toString(36)}`);
  const [userId, setUserId] = useState('dr.sanjay@hospital.org');
  const [isRunning, setIsRunning] = useState(false);
  const [step1Result, setStep1Result] = useState<any | null>(null);
  const [step2Result, setStep2Result] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateNewKey = () => {
    sound.playClick();
    setIdempotencyKey(`ehr-pac-${Date.now().toString(36)}`);
    setStep1Result(null);
    setStep2Result(null);
    setError(null);
  };

  const runProof = async () => {
    sound.playClick();
    setIsRunning(true);
    setError(null);
    setStep1Result(null);
    setStep2Result(null);

    const startTime = `${selectedDate}T${hour.toString().padStart(2, '0')}:00:00.000Z`;
    const endTime = `${selectedDate}T${(hour + 1).toString().padStart(2, '0')}:00:00.000Z`;

    try {
      // 1. Initial Request
      const t1Start = performance.now();
      const res1 = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          resourceId: selectedResourceId,
          userId,
          startTime,
          endTime,
        }),
      });
      const t1End = performance.now();
      const data1 = await res1.json();
      setStep1Result({
        status: res1.status,
        durationMs: (t1End - t1Start).toFixed(1),
        data: data1,
      });

      // Brief simulated network jitter
      await new Promise((r) => setTimeout(r, 250));

      // 2. Duplicate Request with identical Idempotency-Key
      const t2Start = performance.now();
      const res2 = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          resourceId: selectedResourceId,
          userId,
          startTime,
          endTime,
        }),
      });
      const t2End = performance.now();
      const data2 = await res2.json();
      setStep2Result({
        status: res2.status,
        durationMs: (t2End - t2Start).toFixed(1),
        data: data2,
      });

      sound.playLock();
      onSuccess();
    } catch (err: any) {
      sound.playConflict();
      setError(err.message || 'Idempotency simulation failed');
    } finally {
      setIsRunning(false);
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
          <div className="w-11 h-11 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <Repeat className="w-6 h-6 stroke-[2.4]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-display text-lg font-bold text-white tracking-tight">
                Hospital PACS / EHR Idempotency Verification
              </h3>
              <span className="text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40 px-2 py-0.5 rounded-full uppercase tracking-wider">
                RFC 7231 Safe
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Guarantees that network retries or accidental double-clicks from clinical workstations never create duplicate surgical bookings.
            </p>
          </div>
        </div>

        {/* Parameters Form */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block font-mono text-slate-400 mb-1">
              Selected Clinical Facility
            </label>
            <select
              value={selectedResourceId}
              onChange={(e) => setSelectedResourceId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-teal-500"
            >
              {resources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-mono text-slate-400 mb-1">
              Physician Attending
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="block font-mono text-slate-400">
                Idempotency-Key Header Token
              </label>
              <button
                type="button"
                onClick={generateNewKey}
                className="text-teal-400 hover:text-teal-300 text-[11px] font-mono flex items-center space-x-1"
              >
                <RotateCw className="w-3 h-3" />
                <span>Regenerate Key</span>
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={idempotencyKey}
                readOnly
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-teal-300 font-mono select-all focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-5">
          <button
            onClick={runProof}
            disabled={isRunning}
            className="w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-98"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {isRunning
                ? 'Dispatching Duplicate Clinical Requests...'
                : 'Fire Original Request + Immediate Duplicate with Same Key'}
            </span>
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Step Comparison Visualizer */}
        {(step1Result || step2Result) && (
          <div className="mt-6 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              {/* Request 1 Card */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-bold text-slate-300">REQUEST #1 (INITIAL)</span>
                  <span className="text-[10px] text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded">
                    HTTP {step1Result?.status} Created
                  </span>
                </div>
                <div className="space-y-1 text-slate-400 text-[11px]">
                  <div>Server Execution: <strong className="text-white">{step1Result?.durationMs}ms</strong></div>
                  <div>Booking ID: <strong className="text-teal-300">{step1Result?.data?.booking?.id}</strong></div>
                  <div>Idempotent Retry Flag: <strong className="text-slate-300">{String(step1Result?.data?.isIdempotentRetry)}</strong></div>
                </div>
              </div>

              {/* Request 2 Card */}
              <div className="p-4 rounded-xl bg-slate-950 border border-teal-500/40 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="font-bold text-teal-300">REQUEST #2 (NETWORK RETRY)</span>
                  <span className="text-[10px] text-teal-300 bg-teal-500/20 px-2 py-0.5 rounded font-bold">
                    HTTP {step2Result?.status} OK (Cached Tx)
                  </span>
                </div>
                <div className="space-y-1 text-slate-400 text-[11px]">
                  <div>Server Execution: <strong className="text-white">{step2Result?.durationMs}ms</strong></div>
                  <div>Booking ID: <strong className="text-teal-300">{step2Result?.data?.booking?.id}</strong></div>
                  <div>Idempotent Retry Flag: <strong className="text-teal-400">{String(step2Result?.data?.isIdempotentRetry)}</strong></div>
                </div>
              </div>
            </div>

            {/* Proof Confirmation Badge */}
            {step1Result?.data?.booking?.id === step2Result?.data?.booking?.id && (
              <div className="p-3 bg-teal-500/10 rounded-xl border border-teal-500/30 text-teal-300 text-xs flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 shrink-0 text-teal-400" />
                <span>
                  <strong>Idempotency Proven:</strong> Exact same reservation ID (<span className="font-mono">{step1Result?.data?.booking?.id}</span>) returned for both requests. Zero duplicate procedures created.
                </span>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
