import React, { useState, useRef, useEffect } from 'react';
import { 
  HeartPulse,
  Stethoscope,
  Activity,
  ShieldCheck,
  ShieldAlert,
  Flame,
  Repeat,
  RotateCcw,
  SplitSquareVertical,
  CalendarDays,
  BookmarkCheck,
  ChevronDown,
  Volume2,
  VolumeX,
  SlidersHorizontal,
  CheckCircle2,
  Sparkles,
  Zap,
  Building2,
  Radio,
  Check
} from 'lucide-react';
import { sound } from '../utils/audio';

interface NavbarProps {
  currentRole: 'USER' | 'ADMIN';
  onRoleChange: (role: 'USER' | 'ADMIN') => void;
  isSplitView: boolean;
  onToggleSplitView: () => void;
  onOpenChaosModal: () => void;
  onOpenIdempotencyModal: () => void;
  onResetData: () => void;
  isConnected: boolean;
  activeTab: 'calendar' | 'audit' | 'my-bookings';
  onTabChange: (tab: 'calendar' | 'audit' | 'my-bookings') => void;
  currentUser: string;
  onUserChange: (user: string) => void;
  bookingCount: number;
}

export const CLINICAL_PHYSICIANS = [
  { id: 'dr.sanjay@hospital.org', name: 'Dr. Sanjay, MD', title: 'Chief of Surgery', dept: 'Cardiothoracic OR', avatarBg: 'from-teal-500 to-emerald-600' },
  { id: 'dr.sarah@hospital.org', name: 'Dr. Sarah Chen, MD', title: 'Chief of Radiology', dept: 'Neuro-Imaging', avatarBg: 'from-cyan-500 to-blue-600' },
  { id: 'dr.marcus@hospital.org', name: 'Dr. Marcus Vance, MD', title: 'Trauma Director', dept: 'Emergency Dept', avatarBg: 'from-amber-500 to-rose-600' },
  { id: 'dr.elena@hospital.org', name: 'Dr. Elena Rostova, MD', title: 'Robotic Surgeon', dept: 'Surgical Oncology', avatarBg: 'from-purple-500 to-indigo-600' },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  isSplitView,
  onToggleSplitView,
  onOpenChaosModal,
  onOpenIdempotencyModal,
  onResetData,
  isConnected,
  activeTab,
  onTabChange,
  currentUser,
  onUserChange,
  bookingCount,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isPhysicianMenuOpen, setIsPhysicianMenuOpen] = useState(false);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const physicianMenuRef = useRef<HTMLDivElement>(null);

  const activePhysician = CLINICAL_PHYSICIANS.find(p => p.id === currentUser) || CLINICAL_PHYSICIANS[0];

  const toggleSound = () => {
    const next = !soundEnabled;
    sound.enabled = next;
    setSoundEnabled(next);
    if (next) sound.playLock();
  };

  // Close dropdowns on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) {
        setIsToolsOpen(false);
      }
      if (physicianMenuRef.current && !physicianMenuRef.current.contains(e.target as Node)) {
        setIsPhysicianMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsToolsOpen(false);
        setIsPhysicianMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <header 
      id="app-header" 
      className="bg-slate-900/80 backdrop-blur-xl border-b border-teal-500/20 text-slate-100 sticky top-0 z-40 shadow-lg shadow-slate-950/40 relative before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-teal-400/30 before:to-transparent"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Identity - Medical Clean Vibe with Clinical Micro-badge */}
          <div className="flex items-center space-x-3 shrink-0">
            <div className="relative flex items-center justify-center">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 via-emerald-600 to-cyan-700 flex items-center justify-center shadow-md shadow-teal-500/25 ring-1 ring-teal-400/40 text-white">
                <HeartPulse className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-display font-extrabold text-xl tracking-tight text-white flex items-center gap-1">
                  Med<span className="text-teal-400 font-bold">Lock</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-bold tracking-wide uppercase bg-teal-500/10 text-teal-300 border border-teal-500/25 px-2 py-0.5 rounded-full backdrop-blur-sm">
                  <ShieldCheck className="w-3 h-3 text-teal-400" />
                  0 Collision Guarantee
                </span>
              </div>
              <p className="text-[11px] text-teal-200/60 font-medium tracking-tight hidden lg:block">
                Critical Care Procedure Allocation Platform
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs - Glassmorphic Pill */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-950/50 backdrop-blur-md p-1 rounded-2xl border border-slate-800/80 shadow-inner">
            <button
              id="tab-calendar"
              onClick={() => {
                sound.playClick();
                onTabChange('calendar');
              }}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                activeTab === 'calendar'
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-sm shadow-teal-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Surgical Grid</span>
            </button>

            <button
              id="tab-my-bookings"
              onClick={() => {
                sound.playClick();
                onTabChange('my-bookings');
              }}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                activeTab === 'my-bookings'
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-sm shadow-teal-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              <span>My Procedures</span>
              {bookingCount > 0 && (
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                  activeTab === 'my-bookings' ? 'bg-slate-950 text-teal-300' : 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                }`}>
                  {bookingCount}
                </span>
              )}
            </button>

            <button
              id="tab-audit"
              onClick={() => {
                sound.playClick();
                onTabChange('audit');
              }}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                activeTab === 'audit'
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-sm shadow-teal-500/25'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Audit Ledger</span>
            </button>
          </nav>

          {/* Right Action Toolbar - Decongested & Neatly Grouped */}
          <div className="flex items-center space-x-2.5 shrink-0">
            
            {/* Active Contention Arena Indicator Pill (Visible when split view is active for 1-click exit) */}
            {isSplitView && (
              <button
                onClick={() => {
                  sound.playClick();
                  onToggleSplitView();
                }}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-xs font-semibold backdrop-blur-md shadow-sm shadow-cyan-500/20 transition-all duration-150 active:scale-95"
                title="Exit Contention Arena and return to standard surgical grid"
              >
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="hidden sm:inline font-mono">Arena Active</span>
                <span className="text-[11px] text-cyan-400/80 font-mono">✕</span>
              </button>
            )}

            {/* Consolidated Clinical Operations & Simulation Dropdown */}
            <div className="relative" ref={toolsMenuRef}>
              <button
                id="btn-tools-menu"
                onClick={() => {
                  sound.playClick();
                  setIsToolsOpen(!isToolsOpen);
                }}
                title="Clinical Stress Testing & Emergency Lab Operations"
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md border transition-all duration-150 shadow-sm active:scale-95 ${
                  isToolsOpen 
                    ? 'bg-teal-500/20 border-teal-500/50 text-teal-200 ring-2 ring-teal-500/30' 
                    : 'bg-slate-800/60 hover:bg-slate-800/90 border-slate-700/70 hover:border-teal-500/40 text-slate-200'
                }`}
              >
                <div className="w-5 h-5 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <span className="hidden sm:inline">Clinical Lab & Ops</span>
                <span className="sm:hidden">Ops</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isToolsOpen ? 'rotate-180 text-teal-400' : ''}`} />
              </button>

              {/* Operations Popover Panel - Glassmorphic Medical Console */}
              <div 
                className={`absolute right-0 mt-2 w-80 bg-slate-900/95 backdrop-blur-2xl border border-teal-500/30 rounded-2xl shadow-2xl shadow-slate-950/60 p-3.5 z-50 transition-all duration-200 origin-top-right ${
                  isToolsOpen 
                    ? 'opacity-100 scale-100 pointer-events-auto' 
                    : 'opacity-0 scale-95 pointer-events-none'
                }`}
              >
                {/* Header & Live Heartbeat */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-800 mb-2.5">
                  <div className="flex items-center space-x-1.5">
                    <Stethoscope className="w-4 h-4 text-teal-400" />
                    <span className="text-xs font-bold text-slate-100 font-display">Clinical Testing Engine</span>
                  </div>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    isConnected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {isConnected ? 'Sync: Online' : 'Connecting...'}
                  </span>
                </div>

                {/* Section 1: Interactive Concurrency Simulations */}
                <div className="space-y-1.5 mb-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold px-1 block mb-1">
                    Emergency Contention Simulations
                  </span>

                  {/* 1. Simultaneous Surgeon Race Arena */}
                  <button
                    id="btn-split-view-toggle"
                    onClick={() => {
                      sound.playClick();
                      setIsToolsOpen(false);
                      onToggleSplitView();
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition border group ${
                      isSplitView
                        ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-200'
                        : 'bg-slate-950/50 hover:bg-slate-800/80 border-slate-800/80 hover:border-slate-700 text-slate-200'
                    }`}
                  >
                    <div className="flex items-start space-x-2.5">
                      <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                        <SplitSquareVertical className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                          <span>Simultaneous Race Arena</span>
                          {isSplitView && (
                            <span className="text-[9px] font-mono bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded font-bold">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                          Dr. Elena vs Dr. Marcus 0ms collision race
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* 2. Emergency Surge Stress Test (Chaos 100x) */}
                  <button
                    id="btn-chaos-storm"
                    onClick={() => {
                      sound.playConflict();
                      setIsToolsOpen(false);
                      onOpenChaosModal();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition border bg-slate-950/50 hover:bg-slate-800/80 border-slate-800/80 hover:border-rose-500/40 text-slate-200 group"
                  >
                    <div className="flex items-start space-x-2.5">
                      <div className="w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Flame className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                          <span>Emergency Surge (100x)</span>
                          <span className="text-[9px] font-mono bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded font-bold">
                            CHAOS
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                          100 simultaneous emergency OR bookings
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* 3. Hospital PACS / EHR Idempotency Proof */}
                  <button
                    id="menu-idempotency"
                    onClick={() => {
                      sound.playClick();
                      setIsToolsOpen(false);
                      onOpenIdempotencyModal();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition border bg-slate-950/50 hover:bg-slate-800/80 border-slate-800/80 hover:border-teal-500/40 text-slate-200 group"
                  >
                    <div className="flex items-start space-x-2.5">
                      <div className="w-7 h-7 rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Repeat className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                          <span>EHR Idempotency Guard</span>
                          <span className="text-[9px] font-mono bg-teal-500/20 text-teal-300 px-1.5 py-0.2 rounded font-bold">
                            RFC 7231
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                          Prevent network retries from double-booking
                        </div>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Section 2: Hospital Clearance & System Administration */}
                <div className="pt-2.5 border-t border-slate-800 space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold px-1 block mb-1">
                    System Administration & Controls
                  </span>

                  {/* Security Clearance Switcher */}
                  <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5 font-mono text-[11px]">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                      Clearance:
                    </span>
                    <div className="flex items-center space-x-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
                      <button
                        onClick={() => {
                          sound.playClick();
                          onRoleChange('USER');
                        }}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition ${
                          currentRole === 'USER' 
                            ? 'bg-teal-500 text-slate-950 font-bold shadow-sm' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Doctor
                      </button>
                      <button
                        onClick={() => {
                          sound.playClick();
                          onRoleChange('ADMIN');
                        }}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition ${
                          currentRole === 'ADMIN' 
                            ? 'bg-teal-500 text-slate-950 font-bold shadow-sm' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Chief Admin
                      </button>
                    </div>
                  </div>

                  {/* Audio Alerts Toggle */}
                  <button
                    onClick={toggleSound}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-left text-xs hover:bg-slate-800/60 text-slate-300 hover:text-white transition"
                  >
                    <div className="flex items-center space-x-2">
                      {soundEnabled ? (
                        <Volume2 className="w-4 h-4 text-teal-400" />
                      ) : (
                        <VolumeX className="w-4 h-4 text-slate-500" />
                      )}
                      <span>Tactile Clinical Audio Feedback</span>
                    </div>
                    <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                      soundEnabled ? 'text-teal-300 bg-teal-500/10' : 'text-slate-500 bg-slate-900'
                    }`}>
                      {soundEnabled ? 'Enabled' : 'Muted'}
                    </span>
                  </button>

                  {/* Reset Clinical State */}
                  <button
                    id="btn-reset-data"
                    onClick={() => {
                      sound.playClick();
                      setIsToolsOpen(false);
                      onResetData();
                    }}
                    className="w-full flex items-center space-x-2.5 p-2 rounded-xl text-left text-xs hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 transition"
                  >
                    <RotateCcw className="w-4 h-4 shrink-0" />
                    <div>
                      <div className="font-semibold">Reset Clinical State</div>
                      <div className="text-[10px] text-rose-400/70">Restore clean initial hospital schedule</div>
                    </div>
                  </button>
                </div>

              </div>
            </div>

            {/* Attending Physician Persona Dropdown - Compact & Elegant */}
            <div className="relative" ref={physicianMenuRef}>
              <button
                id="btn-physician-selector"
                onClick={() => {
                  sound.playClick();
                  setIsPhysicianMenuOpen(!isPhysicianMenuOpen);
                }}
                className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-xl text-xs backdrop-blur-md border transition-all duration-150 focus:outline-none shadow-sm active:scale-95 ${
                  isPhysicianMenuOpen
                    ? 'bg-slate-800/90 border-teal-500/50 text-white ring-2 ring-teal-500/30'
                    : 'bg-slate-800/60 hover:bg-slate-800/90 border-slate-700/70 hover:border-teal-500/40 text-slate-200'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-gradient-to-tr ${activePhysician.avatarBg} flex items-center justify-center text-[10px] font-bold text-white shadow-sm ring-1 ring-white/20`}>
                  {activePhysician.name.charAt(3) || 'D'}
                </div>
                <div className="text-left hidden lg:block leading-none">
                  <div className="font-semibold text-slate-200">{activePhysician.name}</div>
                  <div className="text-[10px] text-teal-400/80 mt-0.5 flex items-center gap-1 font-mono">
                    <Stethoscope className="w-2.5 h-2.5" />
                    <span>{activePhysician.title}</span>
                  </div>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isPhysicianMenuOpen ? 'rotate-180 text-teal-400' : ''}`} />
              </button>

              {/* Physician Selection Menu */}
              <div 
                className={`absolute right-0 mt-2 w-72 bg-slate-900/95 backdrop-blur-2xl border border-teal-500/30 rounded-2xl shadow-2xl shadow-slate-950/60 p-2.5 z-50 transition-all duration-200 origin-top-right ${
                  isPhysicianMenuOpen 
                    ? 'opacity-100 scale-100 pointer-events-auto' 
                    : 'opacity-0 scale-95 pointer-events-none'
                }`}
              >
                <div className="px-3 py-1.5 text-[10px] font-mono font-bold text-teal-400 uppercase tracking-wider border-b border-slate-800 mb-1.5 flex items-center justify-between">
                  <span>Select Active Attending</span>
                  <Stethoscope className="w-3.5 h-3.5 text-teal-400" />
                </div>
                {CLINICAL_PHYSICIANS.map((physician) => (
                  <button
                    key={physician.id}
                    onClick={() => {
                      sound.playClick();
                      onUserChange(physician.id);
                      setIsPhysicianMenuOpen(false);
                    }}
                    className={`w-full flex items-center space-x-2.5 p-2 rounded-xl text-left text-xs transition duration-150 ${
                      currentUser === physician.id
                        ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/80 border border-transparent'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${physician.avatarBg} flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-sm`}>
                      {physician.name.charAt(3)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate text-slate-100">{physician.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{physician.title} • {physician.dept}</div>
                    </div>
                    {currentUser === physician.id && (
                      <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Mobile Navigation Tabs */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800/80 bg-slate-950/40 backdrop-blur-md">
          <button
            onClick={() => {
              sound.playClick();
              onTabChange('calendar');
            }}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
              activeTab === 'calendar' ? 'text-teal-400 bg-teal-500/10' : 'text-slate-400'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Grid</span>
          </button>
          <button
            onClick={() => {
              sound.playClick();
              onTabChange('my-bookings');
            }}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
              activeTab === 'my-bookings' ? 'text-teal-400 bg-teal-500/10' : 'text-slate-400'
            }`}
          >
            <BookmarkCheck className="w-3.5 h-3.5" />
            <span>Procedures ({bookingCount})</span>
          </button>
          <button
            onClick={() => {
              sound.playClick();
              onTabChange('audit');
            }}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
              activeTab === 'audit' ? 'text-teal-400 bg-teal-500/10' : 'text-slate-400'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
          </button>
        </div>

      </div>
    </header>
  );
};
