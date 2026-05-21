import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Category, Emergency, Impact, Incident, Priority, RiskLevel, Status } from '../types';

interface IncidentFormProps {
  incident: Incident | null;
  nextSrNo: number;
  isAdmin?: boolean;
  onSave: (incident: Incident) => void;
  onClose: () => void;
}

const likelihoods: Emergency[] = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];
const impacts: Impact[] = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];
const priorities: Priority[] = ['Low', 'Medium', 'High', 'Critical'];
const statuses: Status[] = ['Open', 'In Progress', 'Resolved', 'Closed'];
const categories: Category[] = ['Network', 'Hardware', 'Software', 'Security', 'Database', 'Application', 'Other'];
const RISK_OWNER_NAME = 'Amit Kumar Singh';

const LIKELIHOOD_MAP: Record<Emergency, number> = {
  'Very Low': 1,
  Low: 2,
  Medium: 3,
  High: 4,
  'Very High': 5,
};

const IMPACT_MAP: Record<Impact, number> = {
  'Very Low': 1,
  Low: 2,
  Medium: 3,
  High: 4,
  'Very High': 5,
};

function getRiskLevel(score: number): RiskLevel {
  if (score >= 17) return 'Critical';
  if (score >= 10) return 'High';
  if (score >= 5) return 'Medium';
  return 'Low';
}

function computeScore(likelihood: Emergency, impact: Impact): number {
  return (LIKELIHOOD_MAP[likelihood] ?? 1) * (IMPACT_MAP[impact] ?? 1);
}

function generateRefNo(srNo: number) {
  return `RSK-${String(srNo).padStart(3, '0')}`;
}

function toDateInputValue(value?: string) {
  if (!value) return new Date().toISOString().split('T')[0];
  return value.includes('T') ? value.split('T')[0] : value;
}

export default function IncidentForm({
  incident,
  nextSrNo,
  isAdmin = true,
  onSave,
  onClose,
}: IncidentFormProps) {
  const isEdit = !!incident;
  const [supportingDoc, setSupportingDoc] = useState<File | null>(null);
  const [form, setForm] = useState<Omit<Incident, 'id' | 'srNo'>>({
    incidentRefNo: incident ? generateRefNo(incident.srNo) : generateRefNo(nextSrNo),
    incidentDate: toDateInputValue(incident?.incidentDate),
    incidentDetails: incident?.incidentDetails ?? '',
    incidentCategory: incident?.incidentCategory ?? 'Application',
    likelihood: incident?.likelihood ?? incident?.emergency ?? 'Medium',
    impact: incident?.impact ?? 'Medium',
    priority: incident?.priority ?? 'Medium',
    riskScore: incident?.riskScore ?? 9,
    riskLevel: incident?.riskLevel ?? 'Medium',
    rca: incident?.rca ?? '',
    status: incident?.status ?? 'Open',
    supportingDocName: incident?.supportingDocName,
    supportingDocMime: incident?.supportingDocMime,
    adminSupportingDocName: incident?.adminSupportingDocName,
    adminSupportingDocMime: incident?.adminSupportingDocMime,
    createdByEmail: incident?.createdByEmail,
    createdByName: incident?.createdByName,
    approvalStatus: incident?.approvalStatus,
    verifiedByEmail: incident?.verifiedByEmail,
    verifiedByName: incident?.verifiedByName,
    approvedByEmail: incident?.approvedByEmail,
    approvedByName: incident?.approvedByName,
    approvedAt: incident?.approvedAt,
  });

  const riskScore = useMemo(() => computeScore(form.likelihood, form.impact), [form.likelihood, form.impact]);
  const riskLevel = useMemo(() => getRiskLevel(riskScore), [riskScore]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const set = <K extends keyof typeof form>(key: K, value: typeof form[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave({
      ...form,
      id: incident?.id ?? crypto.randomUUID(),
      srNo: incident?.srNo ?? nextSrNo,
      riskScore,
      riskLevel,
      pendingSupportingDoc: supportingDoc,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div>
            <h2 className="text-lg font-semibold">{isEdit ? 'Edit Risk' : 'New Risk'}</h2>
            <p className="text-slate-400 text-xs mt-0.5">
              {isEdit ? `Ref: ${incident!.incidentRefNo}` : `Ref: ${form.incidentRefNo}`}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Risk ID</label>
              <input
                value={form.incidentRefNo}
                readOnly
                required
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-100 text-slate-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Risk Raised Date</label>
              <input
                type="date"
                value={form.incidentDate}
                onChange={(event) => set('incidentDate', event.target.value)}
                required
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Risk Description</label>
            <textarea
              value={form.incidentDetails}
              onChange={(event) => set('incidentDetails', event.target.value)}
              required
              rows={3}
              placeholder="Describe the risk..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Owner</label>
              <div className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-100 text-slate-600">
                {RISK_OWNER_NAME}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Likelihood of Risk</label>
              <select
                value={form.likelihood}
                onChange={(event) => set('likelihood', event.target.value as Emergency)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
              >
                {likelihoods.map((likelihood) => (
                  <option key={likelihood} value={likelihood}>{likelihood}</option>
                ))}
              </select>
            </div>
          </div>

          {isAdmin && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <select
                    value={form.incidentCategory}
                    onChange={(event) => set('incidentCategory', event.target.value as Category)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Impact of Risk</label>
                  <select
                    value={form.impact}
                    onChange={(event) => set('impact', event.target.value as Impact)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                  >
                    {impacts.map((impact) => (
                      <option key={impact} value={impact}>{impact}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(event) => set('priority', event.target.value as Priority)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                  >
                    {priorities.map((priority) => (
                      <option key={priority} value={priority}>{priority}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={form.status}
                    onChange={(event) => set('status', event.target.value as Status)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mitigation Action</label>
                <textarea
                  value={form.rca}
                  onChange={(event) => set('rca', event.target.value)}
                  rows={3}
                  placeholder="Provide mitigation action..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Supporting Doc</label>
            <input
              type="file"
              onChange={(event) => setSupportingDoc(event.target.files?.[0] ?? null)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
            />
            {(supportingDoc || incident?.supportingDocName) && (
              <p className="mt-1 text-xs text-slate-500">
                {supportingDoc?.name ?? (isAdmin ? incident?.adminSupportingDocName : incident?.supportingDocName) ?? incident?.supportingDocName}
              </p>
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
              {isEdit ? 'Save Changes' : 'Create Risk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
