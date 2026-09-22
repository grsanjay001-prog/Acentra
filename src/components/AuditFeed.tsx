import React, { useState } from 'react';
import { AuditEvent, AuditAction } from '../types';
import { 
  Activity, 
  ShieldAlert, 
  CheckCircle, 
  XCircle, 
  Flame, 
  Repeat, 
  FolderPlus, 
  Filter, 
  ChevronDown, 
  ChevronUp,
  Copy,
  Check,
  RotateCcw,
  ClipboardList,
  HeartPulse
} from 'lucide-react';
import { sound } from '../utils/audio';

interface AuditFeedProps {
  events: AuditEvent[];
  onRefresh: () => void;
}

export const AuditFeed: React.FC<AuditFeedProps> = ({ events, onRefresh }) => {
  const [filter, setFilter] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredEvents = events.filter((e) => {
    if (filter === 'ALL') return true;
    return e.action === filter;
  });

  const handleCopyMeta = (id: string, meta: any) => {
    sound.playClick();
    navigator.clipboard.writeText(JSON.stringify(meta, null, 2));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getActionBadge = (action: AuditAction) => {
    switch (action) {
      case 'BOOKING_CREATED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30">
            <CheckCircle className="w-3 h-3 text-teal-400" />
            PROCEDURE_CONFIRMED
          </span>
        );
      case 'CONFLICT_DETECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 animate-pulse">
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            CONFLICT_DEFENDED (409)
          </span>
        );
      case 'BOOKING_CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
            <XCircle className="w-3 h-3 text-slate-400" />
            SUITE_RELEASED
          </span>
        );
      case 'CHAOS_RUN_EXECUTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <Flame className="w-3 h-3 text-purple-400" />
            EMERGENCY_SURGE_TEST
          </span>
        );
      case 'IDEMPOTENT_RETRY':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            <Repeat className="w-3 h-3 text-cyan-400" />
            EHR_RETRY_CACHED
          </span>
        );
      case 'RESOURCE_CREATED':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <FolderPlus className="w-3 h-3 text-amber-400" />
            FACILITY_REGISTERED
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-teal-500/20 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5 text-white">
      {/* Feed Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <h3 className="font-display text-base font-bold text-white tracking-tight flex items-center space-x-2">
              <ClipboardList className="w-5 h-5 text-teal-400" />
              <span>Hospital Real-Time Integrity & Safety Audit Stream</span>
            </h3>
            <span className="text-[10px] font-mono font-semibold bg-slate-950 text-teal-300 border border-slate-800 px-2.5 py-0.5 rounded-full">
              {events.length} verified events
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Every surgical reservation, mutex acquisition, collision defense, and EHR retry is immutably recorded with microsecond timestamps.
          </p>
        </div>

        {/* Filters and Refresh */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <div className="flex items-center space-x-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Filter className="w-3 h-3 text-slate-500" />
            <select
              value={filter}
              onChange={(e) => {
                sound.playClick();
                setFilter(e.target.value);
              }}
              className="bg-transparent text-xs font-mono font-semibold text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">All Operations</option>
              <option value="BOOKING_CREATED" className="bg-slate-900">Procedure Confirmed</option>
              <option value="CONFLICT_DETECTED" className="bg-slate-900">Conflict Defended</option>
              <option value="CHAOS_RUN_EXECUTED" className="bg-slate-900">Surge Runs</option>
              <option value="IDEMPOTENT_RETRY" className="bg-slate-900">EHR Retries</option>
              <option value="BOOKING_CANCELLED" className="bg-slate-900">Cancellations</option>
            </select>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onRefresh();
            }}
            className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
            title="Refresh Audit Stream"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-2.5">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 font-mono">
            No events match the selected clinical filter.
          </div>
        ) : (
          filteredEvents.map((evt) => {
            const isExpanded = expandedId === evt.id;
            return (
              <div
                key={evt.id}
                className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    {getActionBadge(evt.action)}
                    <span className="text-[11px] font-mono text-slate-400">
                      Tx: <span className="text-slate-200">{evt.entityId.slice(0, 16)}</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs font-mono text-slate-400">
                    <span>{new Date(evt.timestampUtc).toLocaleTimeString()} UTC</span>
                    <button
                      onClick={() => {
                        sound.playClick();
                        setExpandedId(isExpanded ? null : evt.id);
                      }}
                      className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded JSON meta */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-800 space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-mono text-[10px]">EHR Transaction Payload:</span>
                      <button
                        onClick={() => handleCopyMeta(evt.id, evt.meta)}
                        className="text-[11px] font-mono text-teal-400 hover:text-teal-300 flex items-center space-x-1"
                      >
                        {copiedId === evt.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId === evt.id ? 'Copied' : 'Copy JSON'}</span>
                      </button>
                    </div>
                    <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-teal-300 overflow-x-auto">
                      {JSON.stringify(evt.meta, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
