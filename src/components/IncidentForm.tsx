import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Category, Emergency, Impact, Incident, Priority, RiskLevel, Status, SystemUser } from '../types';

interface IncidentFormProps {
  incident: Incident | null;
  nextSrNo: number;
  isAdmin?: boolean;
  currentUserEmail?: string;
  systemUsers?: SystemUser[];
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
  return `RSK-${new Date().getFullYear()}-${String(srNo).padStart(3, '0')}`;
}

export default function IncidentForm({
  incident,
  nextSrNo,
  isAdmin = true,
  currentUserEmail = '',
  systemUsers = [],
  onSave,
  onClose,
}: IncidentFormProps) {
  const isEdit = !!incident;
  const verifierOptions = systemUsers.filter((user) => user.email !== currentUserEmail);
  const [verifiedBy, setVerifiedBy] = useState('');
  const [approvalError, setApprovalError] = useState('');
  const [form, setForm] = useState<Omit<Incident, 'id' | 'srNo'>>({
    incidentRefNo: incident?.incidentRefNo ?? generateRefNo(nextSrNo),
    incidentDate: incident?.incidentDate ?? new Date().toISOString().split('T')[0],
    incidentDetails: incident?.incidentDetails ?? '',
    incidentCategory: incident?.incidentCategory ?? 'Application',
    likelihood: incident?.likelihood ?? incident?.emergency ?? 'Medium',
    impact: incident?.impact ?? 'Medium',
    priority: incident?.priority ?? 'Medium',
    riskScore: incident?.riskScore ?? 9,
    riskLevel: incident?.riskLevel ?? 'Medium',
    rca: incident?.rca ?? '',
    status: incident?.status ?? 'Open',
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
    if (key === 'status' || key === 'rca') setApprovalError('');
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (isAdmin && form.status === 'Closed' && !verifiedBy) {
      setApprovalError('Select a verifier before saving approval.');
      return;
    }

    onSave({
      ...form,
      id: incident?.id ?? crypto.randomUUID(),
      srNo: incident?.srNo ?? nextSrNo,
      riskScore,
      riskLevel,
    });
  };

  const approveRisk = () => {
    if (!verifiedBy) {
      setApprovalError('Select a verifier before approving.');
      return;
    }
    setApprovalError('');
    set('status', 'Closed');
  };

  const riskLevelColor: Record<RiskLevel, string> = {
    Low: 'bg-slate-100 text-slate-700 ring-slate-200',
    Medium: 'bg-amber-100 text-amber-700 ring-amber-200',
    High: 'bg-orange-100 text-orange-700 ring-orange-200',
    Critical: 'bg-red-100 text-red-700 ring-red-200',
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
          {isAdmin && (
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Risk Score</p>
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold text-slate-800">{riskScore}</div>
                <span className={`inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full ring-1 ${riskLevelColor[riskLevel]}`}>
                  {riskLevel}
                </span>
                <span className="text-xs text-slate-400 ml-auto">Likelihood x Impact</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Risk ID</label>
              <input
                value={form.incidentRefNo}
                onChange={(event) => set('incidentRefNo', event.target.value)}
                required
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Mitigation Action</label>
                <textarea
                  value={form.rca}
                  onChange={(event) => set('rca', event.target.value)}
                  rows={3}
                  placeholder="Provide mitigation action..."
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
                />
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Verified By</label>
                    <select
                      value={verifiedBy}
                      onChange={(event) => {
                        setVerifiedBy(event.target.value);
                        setApprovalError('');
                      }}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Select user</option>
                      {verifierOptions.map((user) => (
                        <option key={user.id} value={user.fullName || user.email}>
                          {user.fullName || user.email}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-slate-500">
                      This is only shown here. Excel keeps the existing fixed names.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Approval</label>
                    <button
                      type="button"
                      onClick={approveRisk}
                      className="w-full px-4 py-2.5 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
                    >
                      Approve Risk
                    </button>
                    {form.status === 'Closed' && verifiedBy && (
                      <p className="mt-1 text-xs text-emerald-700">Approved for this save by {verifiedBy}.</p>
                    )}
                    {approvalError && <p className="mt-1 text-xs text-red-600">{approvalError}</p>}
                  </div>
                </div>
              </div>
            </>
          )}

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
