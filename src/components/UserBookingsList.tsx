import React from 'react';
import { Booking, Resource } from '../types';
import { BookmarkCheck, Calendar, Clock, MapPin, XCircle, User, CheckCircle2, Stethoscope, HeartPulse } from 'lucide-react';
import { sound } from '../utils/audio';

interface UserBookingsListProps {
  bookings: Booking[];
  resources: Resource[];
  currentUser: string;
  onCancelBooking: (bookingId: string) => void;
}

export const UserBookingsList: React.FC<UserBookingsListProps> = ({
  bookings,
  resources,
  currentUser,
  onCancelBooking,
}) => {
  const userBookings = bookings.filter((b) => b.userId === currentUser);
  const activeBookings = userBookings.filter((b) => b.status === 'CONFIRMED');

  const getResourceName = (resourceId: string) => {
    return resources.find((r) => r.id === resourceId)?.name || 'Unknown Facility';
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-teal-500/20 rounded-2xl p-5 sm:p-6 shadow-sm space-y-6 text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <h3 className="font-display text-base font-bold text-white tracking-tight flex items-center space-x-2">
              <BookmarkCheck className="w-5 h-5 text-teal-400" />
              <span>Attending Schedule for {currentUser}</span>
            </h3>
            <span className="text-[10px] font-mono font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30 px-2.5 py-0.5 rounded-full">
              {activeBookings.length} confirmed procedures
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage your reserved surgical theatres and imaging appointments. Releasing a reservation restores sterile vacancy immediately.
          </p>
        </div>
      </div>

      {/* Bookings List */}
      {activeBookings.length === 0 ? (
        <div className="py-16 text-center text-slate-400 space-y-2">
          <Stethoscope className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs font-semibold text-slate-400">No active procedures scheduled under this physician ID.</p>
          <p className="text-[11px] text-slate-500">Select any open slot in the hospital timeline to reserve a sterile suite.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeBookings.map((b) => {
            const start = new Date(b.startTime);
            const end = new Date(b.endTime);
            const dateStr = start.toLocaleDateString([], {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            const timeStr = `${start.getUTCHours().toString().padStart(2, '0')}:00 – ${end.getUTCHours().toString().padStart(2, '0')}:00 UTC`;

            return (
              <div
                key={b.id}
                className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-slate-700 transition flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-teal-500/15 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3 text-teal-400" />
                      CONFIRMED PROCEDURE
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">
                      Tx: {b.id.substring(0, 10)}
                    </span>
                  </div>

                  <h4 className="font-bold text-white text-sm">
                    {getResourceName(b.resourceId)}
                  </h4>

                  <div className="mt-2 space-y-1.5 text-xs text-slate-400 font-mono">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{dateStr}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-teal-300 font-bold">{timeStr}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-500">
                    EHR: {b.idempotencyKey.slice(0, 14)}...
                  </span>

                  <button
                    onClick={() => {
                      sound.playClick();
                      onCancelBooking(b.id);
                    }}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-800 hover:border-rose-700/60 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 active:scale-95"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Release Suite</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
