import { useState, useEffect, useMemo } from 'react';
import { X, Lock } from 'lucide-react';
import { Incident, Emergency, Impact, Priority, Status, Category, RiskLevel } from '../types';

interface IncidentFormProps {
  incident: Incident | null;
  nextSrNo: number;
  isAdmin?: boolean;
  onSave: (incident: Incident) => void;
  onClose: () => void;
}

const emergencies: Emergency[] = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];
const impacts: Impact[] = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];
const priorities: Priority[] = ['Low', 'Medium', 'High', 'Critical'];
const statuses: Status[] = ['Open', 'In Progress', 'Resolved', 'Closed'];
const categories: Category[]   = ['Network', 'Hardware', 'Software', 'Security', 'Database', 'Application', 'Other'];

const EMERGENCY_MAP: Record<Emergency, number> = {
  'Very Low':  1, Low: 2, Medium: 3, High: 4, 'Very High': 5,
};
const IMPACT_MAP: Record<Impact, number> = {
  'Very Low':  1, Low: 2, Medium: 3, High: 4, 'Very High': 5,
};

function getRiskLevel(score: number): RiskLevel {
  if (score >= 17) return 'Critical';
  if (score >= 10) return 'High';
  if (score >=  5) return 'Medium';
  return 'Low';
}

function computeScore(e: Emergency, i: Impact): number {
  return (EMERGENCY_MAP[e] ?? 1) * (IMPACT_MAP[i] ?? 1);
}

function generateRefNo(srNo: number) {
  return `RSK-${new Date().getFullYear()}-${String(srNo).padStart(3, '0')}`;
}

export default function IncidentForm({ incident, nextSrNo, isAdmin = true, onSave, onClose }: IncidentFormProps) {
  const isEdit = !!incident;
  const [form, setForm] = useState<Omit<Incident, 'id' | 'srNo'>>({
    incidentRefNo:    incident?.incidentRefNo   ?? generateRefNo(nextSrNo),
    incidentDate:    incident?.incidentDate    ?? new Date().toISOString().split('T')[0],
    incidentDetails: incident?.incidentDetails ?? '',
    incidentCategory:incident?.incidentCategory ?? 'Application',
    emergency:      incident?.emergency      ?? 'Medium',
    impact:          incident?.impact          ?? 'Medium',
    priority:        incident?.priority        ?? 'Medium',
    riskScore:       incident?.riskScore       ?? 9,
    riskLevel:       incident?.riskLevel       ?? 'Medium',
    rca:             incident?.rca             ?? '',
    status:          incident?.status          ?? 'Open',
  });

  const riskScore = useMemo(
    () => computeScore(form.emergency, form.impact),
    [form.emergency, form.impact]
  );
  const riskLevel = useMemo(
    () => getRiskLevel(riskScore),
    [riskScore]
  );

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const set = <K extends keyof typeof form>(key: K, value: typeof form[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...form,
      id:        incident?.id  ?? crypto.randomUUID(),
      srNo:      incident?.srNo ?? nextSrNo,
      riskScore,
      riskLevel,
    });
  };

  const riskLevelColor: Record<string, string> = {
    Low:     'bg-slate-100 text-slate-700 ring-slate-200',
    Medium:  'bg-amber-100 text-amber-700 ring-amber-200',
    High:    'bg-orange-100 text-orange-700 ring-orange-200',
    Critical:'bg-red-100 text-red-700 ring-red-200',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div>
            <h2 className="text-lg font-semibold">
              {isEdit ? 'Edit Incident' : 'New Incident'}
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              {isEdit ? `Ref: ${incident!.incidentRefNo}` : `Ref: ${form.incidentRefNo}`}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Risk Assessment Banner */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Risk Score</p>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold text-slate-800">{riskScore}</div>
              <span className={`inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full ring-1 ${riskLevelColor[riskLevel]}`}>
                {riskLevel}
              </span>
              <span className="text-xs text-slate-400 ml-auto">Likelihood × Impact</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Risk Id</label>
              <input
                value={form.incidentRefNo}
                onChange={(e) => set('incidentRefNo', e.target.value)}
                required
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
              <input
                type="date"
                value={form.incidentDate}
                onChange={(e) => set('incidentDate', e.target.value)}
                required
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={form.incidentDetails}
              onChange={(e) => set('incidentDetails', e.target.value)}
              required
              rows={3}
              placeholder="Describe the incident in detail..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 resize-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select
                value={form.incidentCategory}
                onChange={(e) => set('incidentCategory', e.target.value as Category)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700">Impact</label>
                {!isAdmin && (
                  <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    <Lock className="w-3 h-3" />
                    Admin only
                  </span>
                )}
              </div>
              {isAdmin ? (
                <select
                  value={form.impact}
                  onChange={(e) => set('impact', e.target.value as Impact)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                >
                  {impacts.map((imp) => (
                    <option key={imp} value={imp}>{imp}</option>
                  ))}
                </select>
              ) : (
                <div className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-100 text-slate-400">
                  {form.impact || <span className="italic">Not set</span>}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Emergency</label>
              <select
                value={form.emergency}
                onChange={(e) => set('emergency', e.target.value as Emergency)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
              >
                {emergencies.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => set('priority', e.target.value as Priority)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
              >
                {priorities.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value as Status)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col justify-end">
              <div className="border border-slate-200 rounded-lg px-3 py-2.5 bg-slate-100">
                <span className="text-xs font-medium text-slate-500">Risk Score</span>
                <span className="ml-2 text-sm font-bold text-slate-700">
                  {riskScore} <span className="text-xs font-normal text-slate-400">({riskLevel})</span>
                </span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-slate-700">
                Root Cause Analysis (RCA)
              </label>
              {!isAdmin && (
                <span className="flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  <Lock className="w-3 h-3" />
                  Admin only
                </span>
              )}
            </div>
            {isAdmin ? (
              <textarea
                value={form.rca}
                onChange={(e) => set('rca', e.target.value)}
                rows={3}
                placeholder="Provide root cause analysis..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
              />
            ) : (
              <div className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-100 text-slate-400 resize-none min-h-[72px]">
                {form.rca || <span className="italic">Not provided</span>}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-sm"
            >
              {isEdit ? 'Save Changes' : 'Create Incident'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
