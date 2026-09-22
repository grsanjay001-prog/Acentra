import React, { useState } from 'react';
import { Resource, Booking, ConflictResponse } from '../types';
import { 
  Users, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  RotateCcw, 
  ArrowRight, 
  ShieldCheck, 
  Flame, 
  Globe, 
  Radio, 
  Sparkles, 
  ShieldAlert,
  Terminal,
  Activity,
  Check,
  X,
  HeartPulse,
  Stethoscope
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sound } from '../utils/audio';

interface SplitScreenStageViewProps {
  resources: Resource[];
  selectedResourceId: string;
  selectedDate: string;
  bookings: Booking[];
  onRefresh: () => void;
  onConflict: (conflict: ConflictResponse) => void;
}

export const SplitScreenStageView: React.FC<SplitScreenStageViewProps> = ({
  resources,
  selectedResourceId,
  selectedDate,
  bookings,
  onRefresh,
  onConflict,
}) => {
  const [targetHour, setTargetHour] = useState(10); // 10:00 to 11:00 UTC
  const [isRacing, setIsRacing] = useState(false);
  const [doctorAResult, setDoctorAResult] = useState<any | null>(null);
  const [doctorBResult, setDoctorBResult] = useState<any | null>(null);

  const selectedResource = resources.find((r) => r.id === selectedResourceId) || resources[0];

  const startTime = `${selectedDate}T${targetHour.toString().padStart(2, '0')}:00:00.000Z`;
  const endTime = `${selectedDate}T${(targetHour + 1).toString().padStart(2, '0')}:00:00.000Z`;

  // Find if slot is currently booked
  const existingBooking = bookings.find((b) => {
    if (b.resourceId !== selectedResource?.id || b.status !== 'CONFIRMED') return false;
    const bStart = new Date(b.startTime).getTime();
    const bEnd = new Date(b.endTime).getTime();
    const sStart = new Date(startTime).getTime();
    const sEnd = new Date(endTime).getTime();
    return bStart < sEnd && bEnd > sStart;
  });

  const handleSimultaneousRace = async () => {
    if (!selectedResource) return;
    sound.playClick();
    setIsRacing(true);
    setDoctorAResult(null);
    setDoctorBResult(null);

    const keyA = `stage-elena-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const keyB = `stage-marcus-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;

    // Dispatch both clinical booking requests simultaneously in parallel via Promise.all
    const [resA, resB] = await Promise.all([
      fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': keyA,
        },
        body: JSON.stringify({
          resourceId: selectedResource.id,
          userId: 'dr.elena@hospital.org',
          startTime,
          endTime,
        }),
      }),
      fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': keyB,
        },
        body: JSON.stringify({
          resourceId: selectedResource.id,
          userId: 'dr.marcus@hospital.org',
          startTime,
          endTime,
        }),
      }),
    ]);

    const dataA = await resA.json();
    const dataB = await resB.json();

    setDoctorAResult({
      status: resA.status,
      data: dataA,
    });

    setDoctorBResult({
      status: resB.status,
      data: dataB,
    });

    if (resA.status === 201 || resB.status === 201) {
      sound.playLock();
    }
    if (resA.status === 409 || resB.status === 409) {
      sound.playConflict();
    }

    setIsRacing(false);
    onRefresh();

    // Trigger celebratory confetti for the stage win!
    confetti({
      particleCount: 50,
      spread: 50,
      origin: { y: 0.6 },
    });
  };

  const handleBookSingle = async (user: string) => {
    if (!selectedResource) return;
    sound.playClick();
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resourceId: selectedResource.id,
        userId: user,
        startTime,
        endTime,
      }),
    });
    const data = await res.json();
    if (res.status === 409) {
      sound.playConflict();
      onConflict(data);
    } else {
      sound.playLock();
    }
    onRefresh();
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Stage Mission Control Bar */}
      <div className="bg-slate-900/80 backdrop-blur-md border border-teal-500/20 rounded-2xl p-5 sm:p-6 text-white shadow-sm relative overflow-hidden">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-teal-500/10 text-teal-300 border border-teal-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <HeartPulse className="w-3.5 h-3.5 text-teal-400" />
                Emergency Contention Arena
              </span>
              <h3 className="font-display text-base font-bold text-white tracking-tight">
                Simultaneous Emergency OR Request Race (Dr. Elena vs Dr. Marcus)
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Target Facility: <strong className="text-teal-200">{selectedResource?.name}</strong> • Time Slot: <strong className="text-teal-400 font-mono">{targetHour}:00 - {targetHour + 1}:00 UTC</strong>.
              Both surgical teams submit reservations at the exact same millisecond. KeyMutex serializes them so only one team secures the suite, preventing catastrophic double-booking.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
            <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400 font-mono text-[11px]">Contested Slot:</span>
              <select
                value={targetHour}
                onChange={(e) => {
                  sound.playClick();
                  setTargetHour(Number(e.target.value));
                  setDoctorAResult(null);
                  setDoctorBResult(null);
                }}
                className="bg-transparent text-xs font-mono font-bold text-teal-300 focus:outline-none cursor-pointer"
              >
                {[7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((h) => (
                  <option key={h} value={h} className="bg-slate-900 text-white">
                    {h.toString().padStart(2, '0')}:00 - {(h + 1).toString().padStart(2, '0')}:00 UTC
                  </option>
                ))}
              </select>
            </div>

            <button
              id="btn-fire-simultaneous-race"
              onClick={handleSimultaneousRace}
              disabled={isRacing}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-bold rounded-xl text-xs shadow-md shadow-teal-500/20 transition active:scale-95 disabled:opacity-50"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>{isRacing ? 'Simulating High-Speed Contention...' : 'Fire Simultaneous Contention (0ms Delta)'}</span>
            </button>
          </div>
        </div>

        {/* Existing Slot Status Strip */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Current Facility State:</span>
            {existingBooking ? (
              <span className="inline-flex items-center gap-1 font-mono font-semibold text-rose-300 bg-rose-500/10 border border-rose-500/30 px-2.5 py-0.5 rounded-full">
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                Already Allocated to {existingBooking.userId}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-mono font-semibold text-teal-300 bg-teal-500/10 border border-teal-500/30 px-2.5 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3 text-teal-400" />
                Sterile & Uncontested (Ready for Race)
              </span>
            )}
          </div>
          <span className="text-[11px] font-mono text-teal-400/80 hidden sm:inline">
            Zero Patient Overlap Enforced • Atomic Row Mutex Lock
          </span>
        </div>
      </div>

      {/* Side-by-Side Dual Hospital Terminal Simulation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Physician Console 1: Dr. Elena Rostova */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-teal-500/30 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          {/* Simulated Terminal Chrome */}
          <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-[11px] font-mono font-semibold text-slate-400 ml-2">Console Alpha (Surgical Suite Wing)</span>
            </div>
            <div className="bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 text-[10px] font-mono text-teal-300 flex items-center space-x-1.5">
              <Globe className="w-2.5 h-2.5" />
              <span>terminal://or-wing/dr.elena</span>
            </div>
          </div>

          {/* Interior */}
          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-xs font-mono">
                    E
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Dr. Elena Rostova, MD</h4>
                    <p className="text-[11px] font-mono text-slate-400">dr.elena@hospital.org • Surgical Oncology</p>
                  </div>
                </div>
                <button
                  onClick={() => handleBookSingle('dr.elena@hospital.org')}
                  className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
                >
                  Book Solo
                </button>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs font-mono space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Target Facility:</span>
                  <span className="text-white truncate max-w-xs">{selectedResource?.name}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Procedure Window:</span>
                  <span className="text-teal-300">{targetHour}:00 - {targetHour + 1}:00 UTC</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Command:</span>
                  <span className="text-slate-300">POST /api/bookings</span>
                </div>
              </div>
            </div>

            {/* Dr. Elena Result Output */}
            {doctorAResult ? (
              <div className={`p-4 rounded-xl border ${
                doctorAResult.status === 201 || (doctorAResult.status === 200 && doctorAResult.data.isIdempotentRetry)
                  ? 'bg-teal-950/40 border-teal-500/50 text-teal-200'
                  : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
              }`}>
                <div className="flex items-center space-x-2 font-bold text-xs mb-1">
                  {doctorAResult.status === 201 ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-teal-400" />
                      <span>201 Created — Surgical Lock Confirmed!</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                      <span>409 Conflict — Intercepted & Defended</span>
                    </>
                  )}
                </div>
                <p className="text-[11px] opacity-90 font-mono">
                  {doctorAResult.data.message || (doctorAResult.status === 201 ? `Procedure TxId: ${doctorAResult.data.booking?.id}` : 'Facility conflict intercepted')}
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500 font-mono">
                Awaiting emergency contention trigger...
              </div>
            )}
          </div>
        </div>

        {/* Physician Console 2: Dr. Marcus Vance */}
        <div className="bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          {/* Simulated Terminal Chrome */}
          <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-[11px] font-mono font-semibold text-slate-400 ml-2">Console Beta (Trauma Resuscitation Unit)</span>
            </div>
            <div className="bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 text-[10px] font-mono text-cyan-300 flex items-center space-x-1.5">
              <Globe className="w-2.5 h-2.5" />
              <span>terminal://trauma-unit/dr.marcus</span>
            </div>
          </div>

          {/* Interior */}
          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300 font-bold text-xs font-mono">
                    M
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Dr. Marcus Vance, MD</h4>
                    <p className="text-[11px] font-mono text-slate-400">dr.marcus@hospital.org • Trauma Medical Dir</p>
                  </div>
                </div>
                <button
                  onClick={() => handleBookSingle('dr.marcus@hospital.org')}
                  className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
                >
                  Book Solo
                </button>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs font-mono space-y-2">
                <div className="flex justify-between text-slate-400">
                  <span>Target Facility:</span>
                  <span className="text-white truncate max-w-xs">{selectedResource?.name}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Procedure Window:</span>
                  <span className="text-cyan-300">{targetHour}:00 - {targetHour + 1}:00 UTC</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Command:</span>
                  <span className="text-slate-300">POST /api/bookings</span>
                </div>
              </div>
            </div>

            {/* Dr. Marcus Result Output */}
            {doctorBResult ? (
              <div className={`p-4 rounded-xl border ${
                doctorBResult.status === 201 || (doctorBResult.status === 200 && doctorBResult.data.isIdempotentRetry)
                  ? 'bg-teal-950/40 border-teal-500/50 text-teal-200'
                  : 'bg-rose-950/40 border-rose-500/50 text-rose-200'
              }`}>
                <div className="flex items-center space-x-2 font-bold text-xs mb-1">
                  {doctorBResult.status === 201 ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-teal-400" />
                      <span>201 Created — Surgical Lock Confirmed!</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                      <span>409 Conflict — Intercepted & Defended</span>
                    </>
                  )}
                </div>
                <p className="text-[11px] opacity-90 font-mono">
                  {doctorBResult.data.message || (doctorBResult.status === 201 ? `Procedure TxId: ${doctorBResult.data.booking?.id}` : 'Facility conflict intercepted')}
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500 font-mono">
                Awaiting emergency contention trigger...
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
