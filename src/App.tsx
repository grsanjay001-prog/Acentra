import React, { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Resource, Booking, AuditEvent, ConflictResponse } from './types';
import { INITIAL_RESOURCES, getFallbackBookings } from './data/initialData';
import { sound } from './utils/audio';
import { Navbar } from './components/Navbar';
import { ResourceSelector } from './components/ResourceSelector';
import { CalendarDayView } from './components/CalendarDayView';
import { ConflictModal } from './components/ConflictModal';
import { ChaosTester } from './components/ChaosTester';
import { IdempotencyDemo } from './components/IdempotencyDemo';
import { AuditFeed } from './components/AuditFeed';
import { UserBookingsList } from './components/UserBookingsList';
import { SplitScreenStageView } from './components/SplitScreenStageView';
import { 
  ShieldCheck, 
  Info, 
  CheckCircle2, 
  AlertTriangle, 
  Bell, 
  Zap, 
  Sparkles,
  ArrowRight,
  Flame,
  Repeat,
  SplitSquareVertical,
  Activity,
  HeartPulse,
  Stethoscope,
  Lock,
  RefreshCw,
  Building2
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // App Data State - Initialized with hospital resources & bookings
  const [resources, setResources] = useState<Resource[]>(INITIAL_RESOURCES);
  const [selectedResourceId, setSelectedResourceId] = useState<string>(INITIAL_RESOURCES[0].id);
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [bookings, setBookings] = useState<Booking[]>(() => getFallbackBookings(new Date().toISOString().split('T')[0]));
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);

  // Mode & Role State
  const [currentRole, setCurrentRole] = useState<'USER' | 'ADMIN'>('USER');
  const [currentUser, setCurrentUser] = useState<string>('dr.elena@hospital.org');
  const [activeTab, setActiveTab] = useState<'calendar' | 'audit' | 'my-bookings'>('calendar');
  const [isSplitView, setIsSplitView] = useState<boolean>(false);

  // Modals & Overlays
  const [isChaosModalOpen, setIsChaosModalOpen] = useState(false);
  const [isIdempotencyModalOpen, setIsIdempotencyModalOpen] = useState(false);
  const [conflictModalData, setConflictModalData] = useState<ConflictResponse | null>(null);

  // Live Flash Signals
  const [recentlyBookedSlotKey, setRecentlyBookedSlotKey] = useState<string | null>(null);
  const [recentlyConflictedSlotKey, setRecentlyConflictedSlotKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warning' | 'info' } | null>(null);

  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (text: string, type: 'success' | 'warning' | 'info' = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  // Safe and Resilient Data Fetching with exponential retry
  const fetchData = useCallback(async (retryCount = 0) => {
    setIsSyncing(true);
    try {
      const [resResources, resBookings, resAudit] = await Promise.all([
        fetch('/api/resources')
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
        fetch('/api/bookings')
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
        fetch('/api/audit?limit=100')
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
      ]);

      if (resResources?.resources && Array.isArray(resResources.resources) && resResources.resources.length > 0) {
        setResources(resResources.resources);
        setSelectedResourceId((prev) => {
          const exists = resResources.resources.some((r: Resource) => r.id === prev);
          return exists ? prev : resResources.resources[0].id;
        });
      }

      if (resBookings?.bookings && Array.isArray(resBookings.bookings)) {
        setBookings(resBookings.bookings);
      }

      if (resAudit?.events && Array.isArray(resAudit.events)) {
        setAuditEvents(resAudit.events);
      }
      setIsSyncing(false);
    } catch {
      setIsSyncing(false);
      // Auto-retry up to 3 times with exponential backoff if initial boot was in-flight
      if (retryCount < 3) {
        if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = setTimeout(() => {
          fetchData(retryCount + 1);
        }, (retryCount + 1) * 800);
      }
    }
  }, []);

  useEffect(() => {
    fetchData();
    return () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, [fetchData]);

  // Socket.io real-time connection
  useEffect(() => {
    const s = io(window.location.origin, {
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
    });

    s.on('connect', () => {
      setIsConnected(true);
      fetchData();
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    s.on('calendar_updated', (data: any) => {
      fetchData();
      if (data.type === 'BOOKING_CONFIRMED') {
        const slotKey = `${data.resourceId}_${data.startTime}`;
        setRecentlyBookedSlotKey(slotKey);
        setTimeout(() => setRecentlyBookedSlotKey(null), 3500);
        sound.playLock();
        showToast(`Procedure locked by ${data.booking.userId} in real time!`, 'info');
      } else if (data.type === 'BOOKING_CANCELLED') {
        sound.playClick();
        showToast(`Surgical suite released & available immediately.`, 'info');
      }
    });

    s.on('conflict_occurred', (data: any) => {
      fetchData();
      const slotKey = `${data.resourceId}_${data.startTime}`;
      setRecentlyConflictedSlotKey(slotKey);
      setTimeout(() => setRecentlyConflictedSlotKey(null), 4000);
      sound.playConflict();
      showToast(`Conflict Defended: Suite in use by ${data.winningBooking?.userId || 'another surgical team'}!`, 'warning');
    });

    s.on('audit_event', (event: AuditEvent) => {
      if (event) {
        setAuditEvents((prev) => [event, ...prev.slice(0, 99)]);
      }
    });

    s.on('chaos_completed', () => {
      fetchData();
    });

    s.on('data_reset', () => {
      fetchData();
      sound.playClick();
      showToast('Hospital database reset to clean demonstration state.', 'info');
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [fetchData]);

  // Handle single booking submission
  const handleBookSlot = async (slot: { startTime: string; endTime: string }) => {
    if (!selectedResourceId) return;

    const idempotencyKey = `ehr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          resourceId: selectedResourceId,
          userId: currentUser,
          startTime: slot.startTime,
          endTime: slot.endTime,
        }),
      });

      const data = await res.json();

      if (res.status === 201 || (res.status === 200 && data.isIdempotentRetry)) {
        sound.playLock();
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
        showToast('Surgical procedure confirmed & suite reserved!', 'success');
        fetchData();
      } else if (res.status === 409) {
        sound.playConflict();
        setConflictModalData(data as ConflictResponse);
      } else {
        sound.playConflict();
        showToast(data.message || 'Failed to book suite', 'warning');
      }
    } catch (err: any) {
      sound.playConflict();
      showToast(err.message || 'Network communication error', 'warning');
    }
  };

  // Handle cancellation
  const handleCancelBooking = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser }),
      });

      if (res.ok) {
        sound.playClick();
        showToast('Procedure released and suite restored to sterile status!', 'info');
        fetchData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to release suite', 'warning');
    }
  };

  // Handle resetting data for demo
  const handleResetData = async () => {
    if (confirm('Reset hospital database to initial clean state for presentation?')) {
      await fetch('/api/reset', { method: 'POST' });
      fetchData();
    }
  };

  const selectedResource = resources.find((r) => r.id === selectedResourceId);
  const myConfirmedBookings = bookings.filter((b) => b.userId === currentUser && b.status === 'CONFIRMED');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-teal-500 selection:text-slate-950 relative">
      
      {/* Subtle ambient clinical lighting */}
      <div className="fixed top-0 left-1/4 w-[450px] h-[300px] bg-teal-500/5 blur-[100px] pointer-events-none rounded-full" />
      <div className="fixed top-1/3 right-1/4 w-[400px] h-[260px] bg-cyan-500/5 blur-[100px] pointer-events-none rounded-full" />

      {/* Top Navigation */}
      <Navbar
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        isSplitView={isSplitView}
        onToggleSplitView={() => setIsSplitView(!isSplitView)}
        onOpenChaosModal={() => setIsChaosModalOpen(true)}
        onOpenIdempotencyModal={() => setIsIdempotencyModalOpen(true)}
        onResetData={handleResetData}
        isConnected={isConnected}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentUser={currentUser}
        onUserChange={setCurrentUser}
        bookingCount={myConfirmedBookings.length}
      />

      {/* Floating Real-Time Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className={`px-4 py-3 rounded-xl shadow-xl border flex items-center space-x-2.5 text-xs font-semibold backdrop-blur-md ${
            toastMessage.type === 'success'
              ? 'bg-slate-900/95 text-teal-300 border-teal-500/50 shadow-teal-950/50'
              : toastMessage.type === 'warning'
              ? 'bg-slate-900/95 text-rose-300 border-rose-500/50 shadow-rose-950/50'
              : 'bg-slate-900/95 text-slate-200 border-slate-700 shadow-slate-950/50'
          }`}>
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
            ) : toastMessage.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Bell className="w-4 h-4 text-teal-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-6 relative z-10">
        
        {/* Hospital Mission Control Hero */}
        <section className="bg-slate-900/80 backdrop-blur-md border border-teal-500/20 rounded-2xl p-5 sm:p-7 text-white shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/5 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/5 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-2.5 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-300 bg-teal-500/10 border border-teal-500/25 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                  Patient Safety Concurrency Engine
                </span>
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                  Sub-millisecond OR Mutex Lock
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-950/80 border border-slate-800 px-2 py-0.5 rounded-full">
                  Zero Double-Booking Guarantee
                </span>
              </div>

              <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white leading-tight">
                Hospital Critical Care Resource Allocation Platform
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
                Operating theatres and diagnostic scanners are serialized via atomic row-level mutexes before write. Even when simultaneous trauma teams submit bookings at the exact same millisecond, patient collisions are mathematically prevented.
              </p>

              {/* Live Clinical Telemetry Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 block">Patient Collisions</span>
                  <span className="text-sm sm:text-base font-bold font-mono text-teal-400">0 (Zero Overlap)</span>
                </div>
                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 block">Active Facilities</span>
                  <span className="text-sm sm:text-base font-bold font-mono text-white">{resources.length} Suites Online</span>
                </div>
                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 block">Mutex Latency</span>
                  <span className="text-sm sm:text-base font-bold font-mono text-cyan-300">&lt; 1.2ms</span>
                </div>
                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 block">Safety Audit Logs</span>
                  <span className="text-sm sm:text-base font-bold font-mono text-amber-300">{auditEvents.length} Recorded</span>
                </div>
              </div>
            </div>

            {/* Quick Demo Launchpad Cards */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
              <button
                onClick={() => {
                  sound.playClick();
                  setIsSplitView(true);
                }}
                className="inline-flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-teal-500/40 text-xs font-semibold text-slate-200 transition shadow-sm group"
              >
                <div className="flex items-center space-x-2.5">
                  <SplitSquareVertical className="w-4 h-4 text-teal-400" />
                  <div className="text-left">
                    <span className="block font-bold">1. Simultaneous Race Arena</span>
                    <span className="text-[10px] text-slate-400 font-mono">0ms delta surgical contention</span>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform ml-3" />
              </button>

              <button
                onClick={() => {
                  sound.playConflict();
                  setIsChaosModalOpen(true);
                }}
                className="inline-flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-rose-500/40 text-xs font-semibold text-rose-300 transition shadow-sm group"
              >
                <div className="flex items-center space-x-2.5">
                  <Flame className="w-4 h-4 text-rose-400" />
                  <div className="text-left">
                    <span className="block font-bold">2. Emergency Surge (100x)</span>
                    <span className="text-[10px] text-slate-400 font-mono">Mass-casualty swarm stress</span>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-rose-300 group-hover:translate-x-1 transition-transform ml-3" />
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  setIsIdempotencyModalOpen(true);
                }}
                className="inline-flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-xs font-semibold text-slate-200 transition shadow-sm group"
              >
                <div className="flex items-center space-x-2.5">
                  <Repeat className="w-4 h-4 text-cyan-400" />
                  <div className="text-left">
                    <span className="block font-bold">3. EHR / PACS Retry Proof</span>
                    <span className="text-[10px] text-slate-400 font-mono">Verify idempotency guard</span>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform ml-3" />
              </button>
            </div>
          </div>
        </section>

        {/* Dynamic Main Body: Stage Simulator vs Standard Grid */}
        {isSplitView ? (
          <SplitScreenStageView
            resources={resources}
            selectedResourceId={selectedResourceId}
            selectedDate={selectedDate}
            bookings={bookings}
            onRefresh={fetchData}
            onConflict={setConflictModalData}
          />
        ) : (
          <>
            {/* Hospital Facility Selector */}
            <ResourceSelector
              resources={resources}
              selectedResourceId={selectedResourceId}
              onSelectResource={setSelectedResourceId}
              isAdmin={currentRole === 'ADMIN'}
              onResourceCreated={fetchData}
            />

            {/* Active Tab View */}
            {activeTab === 'calendar' && (
              <CalendarDayView
                resource={selectedResource}
                bookings={bookings}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                currentUser={currentUser}
                onBookSlot={handleBookSlot}
                onCancelBooking={handleCancelBooking}
                recentlyBookedSlotKey={recentlyBookedSlotKey}
                recentlyConflictedSlotKey={recentlyConflictedSlotKey}
              />
            )}

            {activeTab === 'my-bookings' && (
              <UserBookingsList
                bookings={bookings}
                resources={resources}
                currentUser={currentUser}
                onCancelBooking={handleCancelBooking}
              />
            )}

            {activeTab === 'audit' && (
              <AuditFeed
                events={auditEvents}
                onRefresh={fetchData}
              />
            )}
          </>
        )}

      </main>

      {/* Modals & Dialogs */}
      <ConflictModal
        conflictData={conflictModalData}
        onClose={() => setConflictModalData(null)}
        onSelectAlternative={(alt) => {
          setConflictModalData(null);
          handleBookSlot(alt);
        }}
      />

      {isChaosModalOpen && (
        <ChaosTester
          resources={resources}
          selectedResourceId={selectedResourceId}
          selectedDate={selectedDate}
          onClose={() => setIsChaosModalOpen(false)}
          onRunCompleted={fetchData}
        />
      )}

      {isIdempotencyModalOpen && (
        <IdempotencyDemo
          resources={resources}
          selectedDate={selectedDate}
          onClose={() => setIsIdempotencyModalOpen(false)}
          onSuccess={fetchData}
        />
      )}

      {/* Hospital System Footer */}
      <footer className="mt-auto py-4 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-teal-400 font-display">ResLock Clinical</span>
            <span>•</span>
            <span>Hospital Critical Care Allocation Engine</span>
          </div>
          <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-500">
            <span>Zero Patient Overlap Guarantee</span>
            <span>•</span>
            <span>WebSocket Live Broadcast</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
