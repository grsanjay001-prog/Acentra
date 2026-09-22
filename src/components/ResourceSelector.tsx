import React, { useState } from 'react';
import { Resource, ResourceType } from '../types';
import { 
  Plus, 
  Stethoscope, 
  Cpu, 
  Activity, 
  HeartPulse, 
  ShieldAlert, 
  Sparkles, 
  Building2, 
  Check, 
  Layers,
  Thermometer,
  ShieldCheck,
  Disc
} from 'lucide-react';
import { sound } from '../utils/audio';

interface ResourceSelectorProps {
  resources: Resource[];
  selectedResourceId: string;
  onSelectResource: (id: string) => void;
  isAdmin: boolean;
  onResourceCreated: () => void;
}

export const ResourceSelector: React.FC<ResourceSelectorProps> = ({
  resources,
  selectedResourceId,
  onSelectResource,
  isAdmin,
  onResourceCreated,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<ResourceType>('ROOM');
  const [capacity, setCapacity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getIconForType = (resType: ResourceType) => {
    switch (resType) {
      case 'ROOM':
        return <Activity className="w-4 h-4 text-teal-400" />;
      case 'COMPUTE':
        return <Cpu className="w-4 h-4 text-cyan-400" />;
      case 'MACHINE':
        return <Disc className="w-4 h-4 text-emerald-400" />;
      case 'EQUIPMENT':
      default:
        return <Stethoscope className="w-4 h-4 text-teal-300" />;
    }
  };

  const getTypeBadgeClass = (resType: ResourceType) => {
    switch (resType) {
      case 'ROOM':
        return 'text-teal-300 bg-teal-500/10 border-teal-500/20';
      case 'COMPUTE':
        return 'text-cyan-300 bg-cyan-500/10 border-cyan-500/20';
      case 'MACHINE':
        return 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20';
      case 'EQUIPMENT':
      default:
        return 'text-teal-200 bg-teal-500/10 border-teal-500/20';
    }
  };

  const handleSelect = (id: string) => {
    sound.playClick();
    onSelectResource(id);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a medical suite or scanner title.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          type,
          capacity: Number(capacity) || 1,
          status: 'ACTIVE',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to provision clinical suite');
      }

      const data = await res.json();
      sound.playLock();
      setIsModalOpen(false);
      setName('');
      setCapacity(1);
      onResourceCreated();
      if (data.resource?.id) {
        onSelectResource(data.resource.id);
      }
    } catch (err: any) {
      setError(err.message || 'Provisioning failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-slate-900/80 backdrop-blur-md border border-teal-500/20 rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-display text-base font-bold text-white tracking-tight">
                  Hospital Critical Suites & Imaging Scanners
                </h2>
                <span className="text-[10px] font-mono font-bold text-teal-300 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                  {resources.length} Verified Sterile
                </span>
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Zero-overlap serialization enforced. Surgical theatres and scanners cannot be double-booked by any concurrent medical team.
          </p>
        </div>

        {isAdmin && (
          <button
            id="btn-add-resource"
            onClick={() => {
              sound.playClick();
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs transition shadow-sm self-start sm:self-auto active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Operating Suite</span>
          </button>
        )}
      </div>

      {/* Grid of Clinical Resource Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {resources.map((resource) => {
          const isSelected = resource.id === selectedResourceId;
          return (
            <button
              key={resource.id}
              id={`resource-card-${resource.id}`}
              onClick={() => handleSelect(resource.id)}
              className={`p-4 rounded-xl text-left border transition-all duration-200 relative flex flex-col justify-between group overflow-hidden ${
                isSelected
                  ? 'bg-slate-900 text-white border-teal-500/70 shadow-md ring-1 ring-teal-500/40'
                  : 'bg-slate-950/40 hover:bg-slate-900/60 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              {isSelected && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400" />
              )}

              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-xl border transition ${
                  isSelected 
                    ? 'bg-teal-500/20 border-teal-500/40 text-teal-300' 
                    : 'bg-slate-900 border-slate-800 text-slate-400 group-hover:border-slate-700'
                }`}>
                  {getIconForType(resource.type)}
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${getTypeBadgeClass(resource.type)}`}>
                    Cap: {resource.capacity} Patient
                  </span>
                  {isSelected ? (
                    <div className="w-4 h-4 rounded-full bg-teal-400 text-slate-950 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-slate-700 group-hover:bg-slate-500 transition-colors" />
                  )}
                </div>
              </div>

              <div>
                <p className={`text-xs font-bold truncate leading-snug ${isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                  {resource.name}
                </p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
                    {resource.type === 'ROOM' ? 'SURGICAL THEATRE' : resource.type === 'MACHINE' ? 'DIAGNOSTIC SCANNER' : resource.type}
                  </span>
                  <span className={`text-[10px] font-mono font-semibold ${isSelected ? 'text-teal-400' : 'text-slate-500'}`}>
                    {isSelected ? 'SELECTED SUITE' : 'CLICK TO VIEW'}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Admin Provision Resource Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-teal-500/30 text-white animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display text-base font-bold text-white flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-teal-400" />
                Commission New Hospital Critical Facility
              </h3>
            </div>
            <p className="text-xs text-slate-400 mb-5">
              Instantiate an operating theatre, scanner, or trauma station protected by KeyMutex locks.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Clinical Facility Name
                </label>
                <input
                  id="input-resource-name"
                  type="text"
                  placeholder="e.g. OR-4: Orthopedic Joint Replacement Theatre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-700 focus:outline-none focus:border-teal-500 bg-slate-950 text-white placeholder-slate-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Facility Category
                  </label>
                  <select
                    id="select-resource-type"
                    value={type}
                    onChange={(e) => setType(e.target.value as ResourceType)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-700 focus:outline-none focus:border-teal-500 bg-slate-950 text-white"
                  >
                    <option value="ROOM">Operating Room / Trauma Theatre</option>
                    <option value="MACHINE">Diagnostic Scanner (MRI, CT)</option>
                    <option value="EQUIPMENT">Specialized Medical Robot / ECMO</option>
                    <option value="COMPUTE">Pathology AI / PACS Cluster</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Patient Capacity
                  </label>
                  <input
                    id="input-resource-capacity"
                    type="number"
                    min="1"
                    max="10"
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-700 focus:outline-none focus:border-teal-500 bg-slate-950 text-white"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold rounded-xl transition shadow-md shadow-teal-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Commissioning...' : 'Commission Facility'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
