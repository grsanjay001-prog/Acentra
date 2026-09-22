import React, { useState } from 'react';
import { Resource, Booking } from '../types';
import { 
  Clock, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  XCircle, 
  ChevronLeft, 
  ChevronRight, 
  Lock, 
  User, 
  Zap,
  Sparkles,
  ShieldAlert,
  ArrowUpRight,
  ShieldCheck,
  Check,
  Stethoscope,
  HeartPulse
} from 'lucide-react';
import { sound } from '../utils/audio';

interface CalendarDayViewProps {
  resource: Resource | undefined;
  bookings: Booking[];
  selectedDate: string; // "YYYY-MM-DD"
  onDateChange: (date: string) => void;
  currentUser: string;
  onBookSlot: (slot: { startTime: string; endTime: string }) => void;
  onCancelBooking: (bookingId: string) => void;
  recentlyBookedSlotKey: string | null;
  recentlyConflictedSlotKey: string | null;
}

export const CalendarDayView: React.FC<CalendarDayViewProps> = ({
  resource,
  bookings,
  selectedDate,
  onDateChange,
  currentUser,
  onBookSlot,
  onCancelBooking,
  recentlyBookedSlotKey,
  recentlyConflictedSlotKey,
}) => {
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  // Clinical operation hours: 07:00 to 19:00 UTC
  const hours = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

  const handlePrevDay = () => {
    sound.playClick();
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    sound.playClick();
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    onDateChange(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    sound.playClick();
    onDateChange(new Date().toISOString().split('T')[0]);
  };

  if (!resource) {
    return (
      <div className="bg-slate-900/60 backdrop-blur-md border border-teal-500/20 rounded-2xl p-12 text-center text-slate-400">
        Please select an active hospital suite to view surgical timeline and availability.
      </div>
    );
  }

  // Calculate day statistics
  const dayBookings = bookings.filter((b) => {
    return b.resourceId === resource.id && b.status === 'CONFIRMED' && b.startTime.startsWith(selectedDate);
  });
  const totalSlots = hours.length;
  const bookedSlotsCount = dayBookings.length;
  const availableSlotsCount = Math.max(0, totalSlots - bookedSlotsCount);
  const occupancyPercentage = Math.round((bookedSlotsCount / totalSlots) * 100);

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-teal-500/20 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6 relative overflow-hidden">
      
      {/* Top Header & Day Metrics */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <h3 className="font-display text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-teal-400" />
              Surgical & Diagnostic Procedure Schedule
            </h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold bg-teal-500/10 text-teal-300 border border-teal-500/25 px-2.5 py-0.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              Sterile Mutex Guard Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Target Facility: <strong className="text-teal-200">{resource.name}</strong> • Concurrency Limit: <span className="font-mono text-teal-400">{resource.capacity} simultaneous patient procedure</span>
          </p>
        </div>

        {/* Date Selector Navigation & Clinical Load Meter */}
        <div className="flex flex-wrap items-center gap-3 self-start lg:self-auto">
          
          {/* Day Occupancy Meter */}
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs font-mono">
            <span className="text-slate-400">Utilization:</span>
            <span className="font-bold text-teal-300">{occupancyPercentage}%</span>
            <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden flex">
              <div 
                className="bg-teal-400 h-full transition-all duration-500" 
                style={{ width: `${occupancyPercentage}%` }}
              />
            </div>
            <span className="text-slate-400">({availableSlotsCount} free)</span>
          </div>

          {/* Date Picker Controls */}
          <div className="flex items-center space-x-1 bg-slate-950/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={handlePrevDay}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-mono font-semibold rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition"
            >
              Today
            </button>

            <div className="flex items-center space-x-1.5 px-2.5 py-1 text-xs font-mono font-bold text-teal-300">
              <CalendarIcon className="w-3.5 h-3.5 text-teal-400" />
              <span>{selectedDate}</span>
            </div>

            <button
              onClick={handleNextDay}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* Hourly Timeline Grid */}
      <div className="space-y-2.5">
        {hours.map((hour) => {
          const startTime = `${selectedDate}T${hour.toString().padStart(2, '0')}:00:00.000Z`;
          const endTime = `${selectedDate}T${(hour + 1).toString().padStart(2, '0')}:00:00.000Z`;
          const slotKey = `${resource.id}_${startTime}`;

          // Find confirmed bookings in this slot
          const slotBookings = bookings.filter((b) => {
            if (b.resourceId !== resource.id || b.status !== 'CONFIRMED') return false;
            const bStart = new Date(b.startTime).getTime();
            const bEnd = new Date(b.endTime).getTime();
            const sStart = new Date(startTime).getTime();
            const sEnd = new Date(endTime).getTime();
            return bStart < sEnd && bEnd > sStart;
          });

          const isFullyBooked = slotBookings.length >= resource.capacity;
          const isRecentlyUpdated = recentlyBookedSlotKey === slotKey;
          const isRecentlyConflicted = recentlyConflictedSlotKey === slotKey;
          const myBooking = slotBookings.find((b) => b.userId === currentUser);
          const isBookedByMe = Boolean(myBooking);

          return (
            <div
              key={hour}
              id={`slot-${hour}`}
              onMouseEnter={() => setHoveredHour(hour)}
              onMouseLeave={() => setHoveredHour(null)}
              className={`p-3.5 rounded-xl border transition-all duration-200 relative flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                isRecentlyConflicted
                  ? 'bg-rose-950/60 border-rose-500 ring-2 ring-rose-500/50 animate-pulse'
                  : isRecentlyUpdated
                  ? 'bg-teal-950/50 border-teal-400 ring-2 ring-teal-400/40 animate-pulse'
                  : isFullyBooked
                  ? isBookedByMe
                    ? 'bg-teal-950/40 border-teal-500/50 text-slate-200'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300'
                  : 'bg-slate-950/30 hover:bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Left Column: Time & Status */}
              <div className="flex items-center space-x-3.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition ${
                  isRecentlyConflicted
                    ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                    : isFullyBooked 
                    ? isBookedByMe
                      ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700' 
                    : 'bg-slate-900 text-teal-400 border-slate-800'
                }`}>
                  {isRecentlyConflicted ? (
                    <ShieldAlert className="w-4 h-4 animate-bounce" />
                  ) : isFullyBooked ? (
                    <Lock className="w-4 h-4" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-white tracking-tight">
                      {hour.toString().padStart(2, '0')}:00 – {(hour + 1).toString().padStart(2, '0')}:00 UTC
                    </span>

                    {isRecentlyConflicted ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full">
                        <ShieldAlert className="w-3 h-3" />
                        COLLISION DEFENDED (409)
                      </span>
                    ) : isRecentlyUpdated ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/40 px-2 py-0.5 rounded-full">
                        <Sparkles className="w-3 h-3" />
                        SURGICAL LOCK CONFIRMED
                      </span>
                    ) : isFullyBooked ? (
                      <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold border px-2 py-0.5 rounded-full ${
                        isBookedByMe 
                          ? 'bg-teal-500/15 text-teal-300 border-teal-500/30' 
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        <Lock className="w-2.5 h-2.5" />
                        {isBookedByMe ? 'YOUR RESERVED PROCEDURE' : 'OCCUPIED / IN PROCEDURE'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        STERILE & AVAILABLE
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 mt-1">
                    {isFullyBooked ? (
                      <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                        <User className="w-3 h-3 text-slate-500" />
                        <span>Attending:</span>
                        <strong className="text-slate-200 font-mono text-[11px] truncate max-w-xs">
                          {slotBookings[0]?.userId}
                        </strong>
                        <span className="text-slate-600">•</span>
                        <span className="text-[10px] font-mono text-slate-500">
                          TxId: {slotBookings[0]?.idempotencyKey ? `${slotBookings[0].idempotencyKey.slice(0, 12)}...` : slotBookings[0]?.id.slice(0, 8)}
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">
                        Zero double-booking guarantee: atomic mutex locks before medical database write.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Actions */}
              <div className="flex items-center space-x-2 self-end md:self-auto shrink-0">
                {isFullyBooked ? (
                  isBookedByMe ? (
                    <button
                      id={`btn-cancel-${hour}`}
                      onClick={() => {
                        sound.playClick();
                        if (myBooking) onCancelBooking(myBooking.id);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-800 hover:border-rose-700/60 text-xs font-semibold transition flex items-center space-x-1.5 active:scale-95"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Release Suite</span>
                    </button>
                  ) : (
                    <div className="px-3 py-1.5 rounded-xl bg-slate-900/90 text-slate-500 border border-slate-800 text-xs font-mono font-medium flex items-center space-x-1.5 select-none">
                      <Lock className="w-3 h-3 text-slate-600" />
                      <span>In Procedure</span>
                    </div>
                  )
                ) : (
                  <button
                    id={`btn-book-${hour}`}
                    onClick={() => {
                      sound.playLock();
                      onBookSlot({ startTime, endTime });
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition shadow-sm active:scale-95 flex items-center space-x-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 fill-slate-950" />
                    <span>Reserve Suite</span>
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-60" />
                  </button>
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
