import React from 'react';
import { ConflictResponse } from '../types';
import { AlertTriangle, Clock, ArrowRight, ShieldAlert, CheckCircle, ShieldCheck, X, Stethoscope } from 'lucide-react';
import { sound } from '../utils/audio';

interface ConflictModalProps {
  conflictData: ConflictResponse | null;
  onClose: () => void;
  onSelectAlternative: (altSlot: { startTime: string; endTime: string }) => void;
}

export const ConflictModal: React.FC<ConflictModalProps> = ({
  conflictData,
  onClose,
  onSelectAlternative,
}) => {
  if (!conflictData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-rose-500/40 text-white relative animate-in zoom-in-95 duration-150">
        
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
        <div className="flex items-start space-x-3.5 pb-4 border-b border-slate-800">
          <div className="w-11 h-11 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
            <ShieldAlert className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full">
                HTTP 409 Conflict
              </span>
              <span className="text-[11px] font-mono text-teal-400">Clinical Mutex Defense</span>
            </div>
            <h3 className="font-display text-base font-bold text-white mt-1">
              Surgical Collision Defended & Blocked
            </h3>
          </div>
        </div>

        {/* Conflict Reason Description */}
        <div className="mt-4 p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-2.5">
          <p className="font-semibold text-white leading-relaxed">
            {conflictData.message}
          </p>
          <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-400 pt-2 border-t border-slate-800 font-mono">
            <div>
              <span className="text-slate-500 block">Requested Suite:</span>
              <p className="text-slate-200 font-semibold truncate mt-0.5">{conflictData.resource.name}</p>
            </div>
            {conflictData.conflictWith && (
              <div>
                <span className="text-slate-500 block">Scheduled Attending:</span>
                <p className="text-teal-400 font-semibold truncate mt-0.5">{conflictData.conflictWith.userId}</p>
              </div>
            )}
          </div>
        </div>

        {/* Alternative Slots Section */}
        {conflictData.hasAlternatives && conflictData.alternatives.length > 0 ? (
          <div className="mt-5">
            <div className="flex items-center space-x-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <h4 className="text-xs font-mono font-bold text-white tracking-wider uppercase">
                Available Alternate Surgical Slots
              </h4>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              The scheduler detected instant sterile vacancies in adjacent hours:
            </p>

            <div className="space-y-2">
              {conflictData.alternatives.map((alt, idx) => (
                <button
                  key={idx}
                  id={`btn-alt-slot-${idx}`}
                  onClick={() => {
                    sound.playLock();
                    onSelectAlternative({ startTime: alt.startTime, endTime: alt.endTime });
                  }}
                  className="w-full p-3 rounded-xl border border-teal-500/30 bg-teal-950/20 hover:bg-teal-950/40 text-teal-200 text-xs font-semibold transition flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-2.5">
                    <Clock className="w-4 h-4 text-teal-400" />
                    <span className="font-mono text-white">{alt.label}</span>
                  </div>
                  <span className="inline-flex items-center space-x-1 text-[11px] font-mono font-bold text-teal-400 group-hover:translate-x-1 transition-transform">
                    <span>Lock This Slot Instead</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-4 p-3 bg-amber-950/40 rounded-xl border border-amber-800/60 text-xs text-amber-300 font-mono">
            No adjacent open slots found for this working day. Please select another date.
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-xl transition"
          >
            Acknowledge & Close
          </button>
        </div>

      </div>
    </div>
  );
};
