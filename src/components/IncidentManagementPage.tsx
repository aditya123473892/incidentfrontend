import { useState } from 'react';
import { Plus, LogOut, Shield, Pencil, Trash2, ChevronUp, ChevronDown, Search } from 'lucide-react';
import { IncidentManagement, Priority, Status, Category, Impact, Urgency } from '../types';

interface IncidentManagementPageProps {
  incidents: IncidentManagement[];
  userEmail: string;
  userRole?: string;
  onAdd: (incident: IncidentManagement) => void;
  onUpdate: (incident: IncidentManagement) => void;
  onDelete: (id: string) => void;
  onLogout: () => void;
}

const IMPACTS: Impact[] = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];
const URGENCIES: Urgency[] = ['Low', 'Medium', 'High'];
const PRIORITIES: Priority[] = ['Critical', 'High', 'Medium', 'Low'];
const STATUSES: Status[] = ['Open', 'In Progress', 'Resolved', 'Closed'];
const CATEGORIES: Category[] = ['Network', 'Hardware', 'Software', 'Security', 'Database', 'Application', 'Other'];

const priorityColors: Record<Priority, string> = {
  Low: 'bg-orange-100 text-orange-700 ring-orange-200',
  Medium: 'bg-yellow-100 text-yellow-700 ring-yellow-200',
  High: 'bg-green-100 text-green-700 ring-green-200',
  Critical: 'bg-red-100 text-red-700 ring-red-200',
};

const statusColors: Record<Status, string> = {
  Open: 'bg-blue-100 text-blue-700 ring-blue-200',
  'In Progress': 'bg-amber-100 text-amber-700 ring-amber-200',
  Resolved: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  Closed: 'bg-slate-100 text-slate-600 ring-slate-200',
};

export default function IncidentManagementPage({
  incidents,
  userEmail,
  userRole,
  onAdd,
  onUpdate,
  onDelete,
  onLogout,
}: IncidentManagementPageProps) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<Status | 'All'>('All');
  const [filterPriority, setFilterPriority] = useState<Priority | 'All'>('All');
  const [sortKey, setSortKey] = useState<keyof IncidentManagement>('srNo');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<IncidentManagement | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleSort = (key: keyof IncidentManagement) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const filtered = incidents
    .filter((i) => {
      const q = search.toLowerCase();
      const matchSearch = !q || (i.incidentRefNo && i.incidentRefNo.toLowerCase().includes(q)) || (i.incidentDetails && i.incidentDetails.toLowerCase().includes(q));
      const matchStatus = filterStatus === 'All' || i.status === filterStatus;
      const matchPriority = filterPriority === 'All' || i.priority === filterPriority;
      return matchSearch && matchStatus && matchPriority;
    })
    .sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const nextSrNo = incidents.length > 0 ? Math.max(...incidents.map((i) => i.srNo || 0)) + 1 : 1;

  const SortIcon = ({ k }: { k: keyof IncidentManagement }) =>
    sortKey === k ? (sortDir === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />) : <ChevronUp className="w-3.5 h-3.5 opacity-20" />;

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-slate-900 text-white shadow-lg">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Incident Management</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-300 text-sm">{userEmail}</span>
            <button onClick={onLogout} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white">
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full sm:w-auto">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as Status | 'All')}
                className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
              >
                <option value="All">All Status</option>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value as Priority | 'All')}
                className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm"
              >
                <option value="All">All Priority</option>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <button
              onClick={() => { setEditTarget(null); setFormOpen(true); }}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm"
            >
              <Plus className="w-4 h-4" />
              New Incident
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  {[{ key: 'srNo', label: 'Sr.' }, { key: 'incidentRefNo', label: 'Ref' }, { key: 'incidentDate', label: 'Date' }, { key: 'incidentDetails', label: 'Details' }, { key: 'incidentCategory', label: 'Cat' }, { key: 'impact', label: 'Impact' }, { key: 'urgency', label: 'Urgency' }, { key: 'priority', label: 'Priority' }, { key: 'responseTarget', label: 'Response' }, { key: 'resolutionTarget', label: 'Resolution' }, { key: 'status', label: 'Status' }].map(({ key, label }) => (
                    <th key={key} onClick={() => handleSort(key as keyof IncidentManagement)} className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase cursor-pointer">
                      <div className="flex items-center gap-1">{label}<SortIcon k={key as keyof IncidentManagement} /></div>
                    </th>
                  ))}
                  <th className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((incident) => (
                  <tr key={incident.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-slate-500 font-mono text-xs">{incident.srNo}</td>
                    <td className="px-3 py-2 font-medium text-blue-600">{incident.incidentRefNo}</td>
                    <td className="px-3 py-2 text-slate-600">{new Date(incident.incidentDate).toLocaleDateString()}</td>
                    <td className="px-3 py-2 text-slate-700 max-w-xs truncate">{incident.incidentDetails}</td>
                    <td className="px-3 py-2"><span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full">{incident.incidentCategory}</span></td>
                    <td className="px-3 py-2 text-slate-600">{incident.impact}</td>
                    <td className="px-3 py-2 text-slate-600">{incident.urgency}</td>
                    <td className="px-3 py-2"><span className={`text-xs px-2 py-1 rounded-full font-semibold ring-1 ${priorityColors[incident.priority]}`}>{incident.priority}</span></td>
                    <td className="px-3 py-2 text-slate-600">{incident.responseTarget}m</td>
                    <td className="px-3 py-2 text-slate-600">{incident.resolutionTarget}h</td>
                    <td className="px-3 py-2"><span className={`text-xs px-2 py-1 rounded-full ${statusColors[incident.status]}`}>{incident.status}</span></td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setEditTarget(incident); setFormOpen(true); }} className="p-1 rounded hover:bg-blue-50"><Pencil className="w-3 h-3" /></button>
                        {userRole === 'admin' && <button onClick={() => setDeleteConfirm(incident.id)} className="p-1 rounded hover:bg-red-50"><Trash2 className="w-3 h-3" /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {formOpen && (
        <IncidentManagementForm
          incident={editTarget}
          nextSrNo={nextSrNo}
          onSave={(inc) => { editTarget ? onUpdate(inc) : onAdd(inc); setFormOpen(false); }}
          onClose={() => { setFormOpen(false); setEditTarget(null); }}
        />
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60">
          <div className="bg-white rounded-2xl p-6 max-w-sm">
            <h3 className="text-lg font-semibold mb-2">Delete Incident?</h3>
            <p className="text-sm text-slate-500 mb-4">Cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-lg">Cancel</button>
              <button onClick={() => { onDelete(deleteConfirm); setDeleteConfirm(null); }} className="px-5 py-2 rounded-lg bg-red-600 text-white">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface IncidentManagementFormProps {
  incident: IncidentManagement | null;
  nextSrNo: number;
  onSave: (incident: IncidentManagement) => void;
  onClose: () => void;
}

function IncidentManagementForm({ incident, nextSrNo, onSave, onClose }: IncidentManagementFormProps) {
  const isEdit = !!incident;
  const [form, setForm] = useState<Partial<IncidentManagement>>(incident || {
    srNo: nextSrNo,
    incidentRefNo: `IM-${new Date().getFullYear()}-${String(nextSrNo).padStart(3, '0')}`,
    incidentDate: new Date().toISOString().split('T')[0],
    incidentDetails: '',
    incidentCategory: 'Application',
    impact: 'Medium',
    urgency: 'Medium',
    rca: '',
    status: 'Open',
  });

  const { High: { High: Critical, Medium: High, Low: HighLow } } = { High: { High: 'Critical', Medium: 'High', Low: 'High' } };
  const getPriority = (impact: string, urgency: string): Priority => {
    const matrix: Record<string, Record<string, Priority>> = {
      High: { High: 'Critical', Medium: 'High', Low: 'High' },
      Medium: { High: 'High', Medium: 'Medium', Low: 'Medium' },
      Low: { High: 'Medium', Medium: 'Low', Low: 'Low' },
      'Very High': { High: 'Critical', Medium: 'Critical', Low: 'High' },
      'Very Low': { High: 'Low', Medium: 'Low', Low: 'Low' },
    };
    return matrix[impact]?.[urgency] || 'Medium';
  };

  const priority = getPriority(form.impact || 'Medium', form.urgency || 'Medium');
  const responseTarget = { Critical: 15, High: 30, Medium: 120, Low: 240 }[priority];
  const resolutionTarget = { Critical: 4, High: 8, Medium: 24, Low: 72 }[priority];

  const set = <K extends keyof IncidentManagement>(key: K, value: IncidentManagement[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...form, id: form.id || crypto.randomUUID(), srNo: form.srNo || nextSrNo, priority, responseTarget, resolutionTarget } as IncidentManagement);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6">
        <h2 className="text-lg font-semibold mb-4">{isEdit ? 'Edit' : 'New'} Incident</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input value={form.incidentRefNo ?? ''} onChange={(e) => set('incidentRefNo', e.target.value)} placeholder="Ref No." className="w-full border rounded-lg px-3 py-2" required />
          <input type="date" value={form.incidentDate ?? ''} onChange={(e) => set('incidentDate', e.target.value)} className="w-full border rounded-lg px-3 py-2" required />
          <textarea value={form.incidentDetails ?? ''} onChange={(e) => set('incidentDetails', e.target.value)} placeholder="Details" className="w-full border rounded-lg px-3 py-2" required />
          <select value={form.incidentCategory ?? 'Application'} onChange={(e) => set('incidentCategory', e.target.value as Category)} className="w-full border rounded-lg px-3 py-2">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={form.impact ?? 'Medium'} onChange={(e) => set('impact', e.target.value as Impact)} className="w-full border rounded-lg px-3 py-2">
            {IMPACTS.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
          <select value={form.urgency ?? 'Medium'} onChange={(e) => set('urgency', e.target.value as Urgency)} className="w-full border rounded-lg px-3 py-2">
            {URGENCIES.map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
          <select value={form.status ?? 'Open'} onChange={(e) => set('status', e.target.value as Status)} className="w-full border rounded-lg px-3 py-2">
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <textarea value={form.rca ?? ''} onChange={(e) => set('rca', e.target.value)} placeholder="RCA" className="w-full border rounded-lg px-3 py-2" />
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border">Cancel</button>
            <button type="submit" className="px-5 py-2 rounded-lg bg-blue-600 text-white">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}