import { useState } from 'react';
import {
  Plus, Search, LogOut, Shield, Pencil, Trash2,
  ChevronUp, ChevronDown, Filter, AlertCircle, Clock,
  CheckCircle2, XCircle, BarChart3, X,
} from 'lucide-react';
import { Incident, Priority, Status, Emergency, Impact, RiskLevel, SystemUser } from '../types';
import IncidentForm from './IncidentForm';

interface DashboardProps {
  incidents: Incident[];
  userEmail: string;
  userRole?: string;
  systemUsers?: SystemUser[];
  apiUrl: string;
  token: string | null;
  onAdd: (incident: Incident) => void;
  onUpdate: (incident: Incident) => void;
  onApprove: (incidentId: string, verifier: SystemUser | { fullName: string; email?: string }) => void;
  onDelete: (id: string) => void;
  onLogout: () => void;
}

const priorityColors: Record<Priority, string> = {
  Low: 'bg-orange-100 text-orange-700 ring-orange-200',
  Medium: 'bg-yellow-100 text-yellow-700 ring-yellow-200',
  High: 'bg-green-100 text-green-700 ring-green-200',
  Critical: 'bg-red-100 text-red-700 ring-red-200',
};

const emergencyColors: Record<Emergency, string> = {
  'Very Low': 'bg-slate-100 text-slate-700 ring-slate-200',
  Low: 'bg-blue-100 text-blue-700 ring-blue-200',
  Medium: 'bg-amber-100 text-amber-700 ring-amber-200',
  High: 'bg-orange-100 text-orange-700 ring-orange-200',
  'Very High': 'bg-red-100 text-red-700 ring-red-200',
};

const impactColors: Record<Impact, string> = {
  'Very Low': 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  Low: 'bg-blue-100 text-blue-700 ring-blue-200',
  Medium: 'bg-amber-100 text-amber-700 ring-amber-200',
  High: 'bg-orange-100 text-orange-700 ring-orange-200',
  'Very High': 'bg-red-100 text-red-700 ring-red-200',
};

const riskLevelColors: Record<RiskLevel, string> = {
  Low: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  Medium: 'bg-amber-100 text-amber-700 ring-amber-200',
  High: 'bg-orange-100 text-orange-700 ring-orange-200',
  Critical: 'bg-red-100 text-red-700 ring-red-200',
};

const statusColors: Record<Status, string> = {
  Open: 'bg-blue-100 text-blue-700 ring-blue-200',
  'In Progress': 'bg-amber-100 text-amber-700 ring-amber-200',
  Resolved: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
  Closed: 'bg-slate-100 text-slate-600 ring-slate-200',
};

const statusIcons: Record<Status, React.ReactNode> = {
  Open: <AlertCircle className="w-3 h-3" />,
  'In Progress': <Clock className="w-3 h-3" />,
  Resolved: <CheckCircle2 className="w-3 h-3" />,
  Closed: <XCircle className="w-3 h-3" />,
};

const RISK_OWNER_NAME = 'Amit Kumar Singh';

type SortKey = keyof Incident;
type SortDir = 'asc' | 'desc';

// Helper function to format dates as dd/mm/yy
const formatDateDDMMYY = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return dateString as string;
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
};

const formatDateMDYYYY = (dateString: string | Date): string => {
  const normalized = typeof dateString === 'string' && dateString.includes('T')
    ? dateString.split('T')[0]
    : dateString;
  const date = typeof normalized === 'string' ? new Date(`${normalized}T00:00:00`) : normalized;
  if (isNaN(date.getTime())) return String(dateString);

  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
};

const formatDateLong = (dateString: string | Date): string => {
  const normalized = typeof dateString === 'string' && dateString.includes('T')
    ? dateString.split('T')[0]
    : dateString;
  const date = typeof normalized === 'string' ? new Date(`${normalized}T00:00:00`) : normalized;
  if (isNaN(date.getTime())) return String(dateString);

  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
};

const escapeExcelCell = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getRiskLikelihood = (incident: Incident): Emergency =>
  incident.likelihood ?? incident.emergency ?? 'Medium';

const hasAdminReview = (incident: Incident): boolean =>
  Boolean(incident.rca?.trim());

const getRiskRefNo = (incident: Incident): string =>
  `RSK-${String(incident.srNo).padStart(3, '0')}`;

export default function Dashboard({
  incidents,
  userEmail,
  userRole,
  systemUsers = [],
  apiUrl,
  token,
  onAdd,
  onUpdate,
  onApprove,
  onDelete,
  onLogout,
}: DashboardProps) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<Status | 'All'>('All');
  const [filterPriority, setFilterPriority] = useState<Priority | 'All'>('All');
  const [sortKey, setSortKey] = useState<SortKey>('srNo');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Incident | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [viewTarget, setViewTarget] = useState<Incident | null>(null);
  const [approveTarget, setApproveTarget] = useState<Incident | null>(null);
  const [selectedVerifierEmail, setSelectedVerifierEmail] = useState('');
  const isAdmin = userRole === 'admin';

  const verifierOptions = [
    ...systemUsers,
    { id: -1, email: '', fullName: 'Dheeraj Adlakha', role: 'verifier' },
  ].filter((user, index, list) => {
    const optionKey = (user.email || user.fullName).toLowerCase();
    if (list.findIndex((item) => (item.email || item.fullName).toLowerCase() === optionKey) !== index) {
      return false;
    }
    if (!approveTarget) return user.email !== userEmail;
    const creatorEmail = approveTarget.createdByEmail?.toLowerCase();
    const creatorName = approveTarget.createdByName?.trim().toLowerCase();
    return (
      (!user.email || user.email !== userEmail) &&
      (user.fullName || user.email).trim().toLowerCase() !== RISK_OWNER_NAME.toLowerCase() &&
      (!creatorEmail || user.email.toLowerCase() !== creatorEmail) &&
      (!creatorName || (user.fullName || user.email).trim().toLowerCase() !== creatorName)
    );
  });

  const selectedVerifier = verifierOptions.find((user) => (user.email || user.fullName) === selectedVerifierEmail);

  const viewSupportingDoc = async (incident: Incident, source: 'user' | 'admin' = 'user') => {
    const fileName = source === 'admin' ? incident.adminSupportingDocName : incident.supportingDocName;
    if (!token || !fileName) return;
    const res = await fetch(`${apiUrl}/incidents/${incident.id}/supporting-doc?source=${source}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const filtered = incidents
    .filter((i) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        (i.incidentRefNo  && i.incidentRefNo.toLowerCase().includes(q))  ||
        (i.incidentDetails && i.incidentDetails.toLowerCase().includes(q)) ||
        (i.incidentCategory && i.incidentCategory.toLowerCase().includes(q));
      const matchStatus    = filterStatus    === 'All' || i.status    === filterStatus;
      const matchPriority  = filterPriority  === 'All' || i.priority  === filterPriority;
      return matchSearch && matchStatus && matchPriority;
    })
    .sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const stats = {
    total: incidents.length,
    open: incidents.filter((i) => i && i.status === 'Open').length,
    inProgress: incidents.filter((i) => i && i.status === 'In Progress').length,
    critical: incidents.filter((i) => i && i.riskLevel === 'Critical').length,
  };

   const nextSrNo = incidents.length > 0
     ? Math.max(...incidents.map((i) => i.srNo || 0)) + 1
     : 1;

   const handleDownloadExcel = () => {
     const approvalDate = filtered.find((incident) => incident.approvedAt)?.approvedAt
       ? formatDateMDYYYY(filtered.find((incident) => incident.approvedAt)!.approvedAt!)
       : '4/1/2025';
     const worksheetRows = filtered.map((incident) => {
       const reviewed = hasAdminReview(incident);
       return `
         <tr class="data-row">
           <td>${escapeExcelCell(getRiskRefNo(incident))}</td>
           <td>${escapeExcelCell(formatDateMDYYYY(incident.incidentDate))}</td>
           <td class="left">${escapeExcelCell(incident.incidentDetails)}</td>
           <td>${escapeExcelCell(RISK_OWNER_NAME)}</td>
           <td>${escapeExcelCell(getRiskLikelihood(incident))}</td>
           <td>${escapeExcelCell(reviewed ? incident.impact : '')}</td>
           <td>${escapeExcelCell(reviewed ? incident.riskLevel : '')}</td>
           <td class="left">${escapeExcelCell(reviewed ? incident.rca : '')}</td>
         </tr>
       `;
     }).join('');

     const excelContent = `
       <html xmlns:o="urn:schemas-microsoft-com:office:office"
             xmlns:x="urn:schemas-microsoft-com:office:excel"
             xmlns="http://www.w3.org/TR/REC-html40">
         <head>
           <meta charset="UTF-8" />
           <!--[if gte mso 9]>
           <xml>
             <x:ExcelWorkbook>
               <x:ExcelWorksheets>
                 <x:ExcelWorksheet>
                   <x:Name>Risk Register</x:Name>
                   <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
                 </x:ExcelWorksheet>
               </x:ExcelWorksheets>
             </x:ExcelWorkbook>
           </xml>
           <![endif]-->
           <style>
             table { border-collapse: collapse; font-family: Calibri, Arial, sans-serif; font-size: 11pt; }
             col.risk-id { width: 80px; }
             col.raised-date { width: 135px; }
             col.description { width: 260px; }
             col.owner { width: 160px; }
             col.likelihood { width: 160px; }
             col.impact { width: 160px; }
             col.severity { width: 175px; }
             col.mitigation { width: 225px; }
             td { vertical-align: middle; text-align: center; padding: 4px 6px; }
             .title { height: 42px; font-weight: 700; font-size: 12pt; text-align: center; }
             .blank { height: 22px; }
             .header td { height: 40px; background: #8c8c8c; color: #000; font-weight: 700; border: 1px solid #000; }
             .data-row td { height: 58px; border: 1px solid #000; white-space: normal; }
             .empty-row td { height: 18px; border: 1px solid #000; }
             .signature td { height: 18px; border: 1px solid #000; font-weight: 700; text-align: left; }
             .signature-date td { height: 18px; border: 1px solid #000; font-weight: 700; text-align: left; mso-number-format:"\\@"; }
             .left { text-align: left; }
           </style>
         </head>
         <body>
           <table>
             <colgroup>
               <col class="risk-id" />
               <col class="raised-date" />
               <col class="description" />
               <col class="owner" />
               <col class="likelihood" />
               <col class="impact" />
               <col class="severity" />
               <col class="mitigation" />
             </colgroup>
             <tr><td class="title" colspan="8">Risk Register for Elogisol Application : Client Name : Pristine Group</td></tr>
             <tr><td class="blank" colspan="8"></td></tr>
             <tr class="header">
               <td>Risk ID</td>
               <td>Risk Raised Date</td>
               <td>Risk Description</td>
               <td>Owner</td>
               <td>Likelihood of Risk</td>
               <td>Impact of Risk</td>
               <td>Severity (Risk Rating)</td>
               <td>Mitigation Action</td>
             </tr>
             ${worksheetRows}
             <tr class="empty-row"><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
             <tr class="empty-row"><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
             <tr class="signature">
               <td></td><td>Created By</td><td></td><td></td><td></td><td>Verified By</td><td></td><td>Approved By</td>
             </tr>
             <tr class="empty-row"><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
             <tr class="signature">
               <td></td><td>Sushil</td><td></td><td></td><td></td><td>Dheeraj Adlakha</td><td></td><td>Amit Kumar Singh</td>
             </tr>
             <tr class="signature-date">
               <td></td><td x:str>${approvalDate}</td><td></td><td></td><td></td><td x:str>${approvalDate}</td><td></td><td x:str>${approvalDate}</td>
             </tr>
             <tr class="signature">
               <td></td><td>Team Leader</td><td></td><td></td><td></td><td>Project Manager</td><td></td><td>Director</td>
             </tr>
             <tr class="empty-row"><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
           </table>
         </body>
       </html>
     `;

     const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
     const url = URL.createObjectURL(blob);
     const link = document.createElement('a');
     link.setAttribute('href', url);
     link.setAttribute('download', `risk_register_${new Date().toISOString().slice(0,10)}.xls`);
     link.style.visibility = 'hidden';
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
   };

   const handlePrint = () => {
     // Create a printable version of the table
     const printWindow = window.open('', '_blank');
     if (!printWindow) return;
     printWindow.document.write(`
       <html>
         <head>
           <title>Risks Report</title>
           <style>
             body { font-family: Arial, sans-serif; margin: 20px; }
             table { border-collapse: collapse; width: 100%; }
             th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
             th { background-color: #f2f2f2; }
             .header { text-align: center; margin-bottom: 20px; }
           </style>
         </head>
         <body>
           <div class="header">
             <h1>Risks Report</h1>
             <p>Generated on: ${new Date().toLocaleString()}</p>
           </div>
           <table>
             <thead>
               <tr>
                 <th>Sr. No.</th>
                 <th>Ref No.</th>
                 <th>Date</th>
                 <th>Description</th>
                 <th>Category</th>
                 <th>Impact</th>
                 <th>Emergency</th>
                 <th>Priority</th>
                 <th>Risk Score</th>
                 <th>Status</th>
                 <th>RCA</th>
               </tr>
             </thead>
             <tbody>
               ${filtered.map(incident => `
                 <tr>
                   <td>${incident.srNo}</td>
                   <td>${getRiskRefNo(incident)}</td>
                   <td>${formatDateDDMMYY(incident.incidentDate)}</td>
                   <td>${incident.incidentDetails}</td>
                   <td>${incident.incidentCategory}</td>
                   <td>${hasAdminReview(incident) ? incident.impact : ''}</td>
                   <td>${getRiskLikelihood(incident)}</td>
                   <td>${incident.priority}</td>
                   <td>${hasAdminReview(incident) ? incident.riskScore : ''}</td>
                   <td>${incident.status}</td>
                   <td>${hasAdminReview(incident) ? incident.rca : ''}</td>
                 </tr>
               `).join('')}
             </tbody>
           </table>
         </body>
       </html>
     `);
     printWindow.document.close();
     printWindow.focus();
     printWindow.print();
   };

   const SortIcon = ({ k }: { k: SortKey }) =>
     sortKey === k ? (
       sortDir === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
     ) : (
       <ChevronUp className="w-3.5 h-3.5 opacity-20" />
     );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-slate-900 text-white shadow-lg">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight">IncidentIQ</span>
              <span className="ml-2 text-slate-400 text-xs hidden sm:inline"> Management System</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                {userEmail[0].toUpperCase()}
              </div>
              <span className="text-sm text-slate-300">{userEmail}</span>
            </div>
            {userRole && (
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                userRole === 'admin'
                  ? 'bg-purple-500/15 text-purple-300 border border-purple-500/25'
                  : 'bg-slate-500/15 text-slate-300 border border-slate-500/20'
              }`}>
                {userRole === 'admin' ? 'Admin' : userRole === 'risk' ? 'Risk' : userRole}
              </span>
            )}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
        </nav>

      <div className="max-w-[1400px] mx-auto px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Risks', value: stats.total, icon: BarChart3, color: 'text-blue-600 bg-blue-50' },
            { label: 'Open', value: stats.open, icon: AlertCircle, color: 'text-blue-600 bg-blue-50' },
            { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'text-amber-600 bg-amber-50' },
            { label: 'Critical Risk', value: stats.critical, icon: AlertCircle, color: 'text-red-600 bg-red-50' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-800">{value}</div>
                <div className="text-xs text-slate-500">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
             <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full sm:w-auto">
               <div className="relative flex-1 max-w-sm">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                   placeholder="Search risks..."
                   className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                 />
               </div>
               <div className="flex items-center gap-2">
                 <Filter className="w-4 h-4 text-slate-400" />
                 <select
                   value={filterStatus}
                   onChange={(e) => setFilterStatus(e.target.value as Status | 'All')}
                   className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                 >
                   <option value="All">All Status</option>
                   {(['Open', 'In Progress', 'Resolved', 'Closed'] as Status[]).map((s) => (
                     <option key={s} value={s}>{s}</option>
                   ))}
                 </select>
                 <select
                   value={filterPriority}
                   onChange={(e) => setFilterPriority(e.target.value as Priority | 'All')}
                   className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                 >
                   <option value="All">All Priority</option>
                   {(['Critical', 'High', 'Medium', 'Low'] as Priority[]).map((p) => (
                     <option key={p} value={p}>{p}</option>
                   ))}
                 </select>
               </div>
             </div>
             <div className="flex items-center gap-3">
               <button
                 onClick={handleDownloadExcel}
                 className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
               >
                 <span className="mr-1">📥</span>
                 Download Excel
               </button>
               <button
                 onClick={handlePrint}
                 className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
               >
                 <span className="mr-1">🖨️</span>
                 Print
               </button>
             </div>
             <button
               onClick={() => { setEditTarget(null); setFormOpen(true); }}
               className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
             >
               <Plus className="w-4 h-4" />
               New Risk
             </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">
              Showing {filtered.length} of {incidents.length} risks
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th onClick={() => handleSort('incidentRefNo')} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-slate-800 select-none whitespace-nowrap">
                    <div className="flex items-center gap-1">Risk ID<SortIcon k="incidentRefNo" /></div>
                  </th>
                  <th onClick={() => handleSort('incidentDate')} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-slate-800 select-none whitespace-nowrap">
                    <div className="flex items-center gap-1">Risk Raised Date<SortIcon k="incidentDate" /></div>
                  </th>
                  <th onClick={() => handleSort('incidentDetails')} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-slate-800 select-none whitespace-nowrap">
                    <div className="flex items-center gap-1">Risk Description<SortIcon k="incidentDetails" /></div>
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Owner</th>
                  <th onClick={() => handleSort('likelihood')} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-slate-800 select-none whitespace-nowrap">
                    <div className="flex items-center gap-1">Likelihood of Risk<SortIcon k="likelihood" /></div>
                  </th>
                  <th onClick={() => handleSort('impact')} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-slate-800 select-none whitespace-nowrap">
                    <div className="flex items-center gap-1">Impact of Risk<SortIcon k="impact" /></div>
                  </th>
                  <th onClick={() => handleSort('riskLevel')} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-slate-800 select-none whitespace-nowrap">
                    <div className="flex items-center gap-1">Severity (Risk Rating)<SortIcon k="riskLevel" /></div>
                  </th>
                  <th onClick={() => handleSort('rca')} className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-slate-800 select-none whitespace-nowrap">
                    <div className="flex items-center gap-1">Mitigation Action<SortIcon k="rca" /></div>
                  </th>
                  {isAdmin && (
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 9 : 8} className="px-4 py-12 text-center text-slate-400 text-sm">
                      No risks found. Adjust your filters or create a new risk.
                    </td>
                  </tr>
                ) : (
                  filtered.map((incident) => (
                    <tr
                      key={incident.id}
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => setViewTarget(incident)}
                          className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                        >
                          {getRiskRefNo(incident)}
                        </button>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                        {formatDateMDYYYY(incident.incidentDate)}
                      </td>
                      <td className="px-4 py-3.5 text-slate-700">
                        <p>{incident.incidentDetails}</p>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">{RISK_OWNER_NAME}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-semibold ring-1 ${emergencyColors[getRiskLikelihood(incident)]}`}>
                          {getRiskLikelihood(incident)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {hasAdminReview(incident) ? (
                          <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-semibold ring-1 ${impactColors[incident.impact]}`}>
                            {incident.impact}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs italic">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {hasAdminReview(incident) ? (
                          <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-bold ring-1 ${riskLevelColors[incident.riskLevel]} border`}>
                            {incident.riskLevel}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs italic">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {hasAdminReview(incident) ? (
                          <p className="text-xs">{incident.rca}</p>
                        ) : (
                          <span className="text-slate-300 text-xs italic">—</span>
                        )}
                        {incident.approvalStatus === 'Approved' && incident.verifiedByName && (
                          <p className="mt-1 text-xs text-emerald-700">
                            Verified by {incident.verifiedByName}
                          </p>
                        )}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <button
                              onClick={() => { setEditTarget(incident); setFormOpen(true); }}
                              disabled={incident.approvalStatus === 'Approved'}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Update
                            </button>
                            <button
                              onClick={() => { setApproveTarget(incident); setSelectedVerifierEmail(incident.verifiedByEmail || incident.verifiedByName || ''); }}
                              disabled={incident.approvalStatus === 'Approved'}
                              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                incident.approvalStatus === 'Approved'
                                  ? 'bg-blue-600 text-white cursor-default'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {incident.approvalStatus === 'Approved' ? 'Approved' : 'Approve'}
                            </button>
                            {incident.supportingDocName && (
                              <button
                                onClick={() => viewSupportingDoc(incident)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                              >
                                User Doc
                              </button>
                            )}
                            {incident.adminSupportingDocName && (
                              <button
                                onClick={() => viewSupportingDoc(incident, 'admin')}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                              >
                                Admin Doc
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {formOpen && (
        <IncidentForm
          incident={editTarget}
          nextSrNo={nextSrNo}
          isAdmin={userRole === 'admin'}
          onSave={(inc) => {
            editTarget ? onUpdate(inc) : onAdd(inc);
            setFormOpen(false);
          }}
          onClose={() => setFormOpen(false)}
        />
      )}

      {/* Approve Modal */}
      {approveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setApproveTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Approve Risk</h3>
                <p className="text-sm text-slate-500 mt-1">{getRiskRefNo(approveTarget)}</p>
              </div>
              <button onClick={() => setApproveTarget(null)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2 text-sm text-slate-600 mb-4">
              <div>Raised Date: {formatDateMDYYYY(approveTarget.incidentDate)}</div>
              {approveTarget.createdByName && <div>Created By: {approveTarget.createdByName}</div>}
              {approveTarget.approvedAt && <div>Approved At: {formatDateMDYYYY(approveTarget.approvedAt)}</div>}
            </div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Verifier Name</label>
            <select
              value={selectedVerifierEmail}
              onChange={(event) => setSelectedVerifierEmail(event.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select verifier</option>
              {verifierOptions.map((user) => (
                <option key={user.email || user.fullName} value={user.email || user.fullName}>
                  {user.fullName || user.email}
                </option>
              ))}
            </select>
            {selectedVerifier && (
              <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 text-sm text-emerald-800">
                Verified by {selectedVerifier.fullName || selectedVerifier.email}. Approved by Amit Kumar Singh.
              </div>
            )}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setApproveTarget(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!selectedVerifier}
                onClick={() => {
                  if (selectedVerifier) onApprove(approveTarget.id, selectedVerifier);
                  setApproveTarget(null);
                }}
                className="px-5 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-500 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">Delete Risk?</h3>
            </div>
            <p className="text-sm text-slate-500 mb-6">
              This action cannot be undone. The risk will be permanently removed.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { onDelete(deleteConfirm); setDeleteConfirm(null); }}
                className="px-5 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-500 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {viewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setViewTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{getRiskRefNo(viewTarget)}</h3>
                <p className="text-slate-400 text-xs mt-0.5">Risk Detail View</p>
              </div>
              <button onClick={() => setViewTarget(null)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: 'Sr. No.',          value: viewTarget.srNo },
                { label: 'Risk Ref No.',  value: getRiskRefNo(viewTarget) },
                { label: 'Risk Date',     value: formatDateLong(viewTarget.incidentDate) },
                { label: 'Category',          value: viewTarget.incidentCategory },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50">
                  <span className="text-sm font-medium text-slate-500">{label}</span>
                  <span className="text-sm text-slate-800 font-medium">{value}</span>
                </div>
              ))}
              <div className="py-2 border-b border-slate-50 flex items-center gap-3">
                <span className="text-sm font-medium text-slate-500 whitespace-nowrap">Emergency</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ring-1 ${emergencyColors[getRiskLikelihood(viewTarget)]}`}>
                  {getRiskLikelihood(viewTarget)}
                </span>
              </div>
              <div className="py-2 border-b border-slate-50 flex items-center gap-3">
                <span className="text-sm font-medium text-slate-500 whitespace-nowrap">Impact</span>
                {hasAdminReview(viewTarget) ? (
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ring-1 ${impactColors[viewTarget.impact]}`}>
                    {viewTarget.impact}
                  </span>
                ) : (
                  <span className="text-sm text-slate-300 italic">-</span>
                )}
              </div>
              <div className="py-2 border-b border-slate-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-500">Priority</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ring-1 ${priorityColors[viewTarget.priority]}`}>
                    {viewTarget.priority}
                  </span>
                </div>
              </div>
              <div className="py-2 border-b border-slate-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-500">Status</span>
                  <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold ring-1 ${statusColors[viewTarget.status]}`}>
                    {statusIcons[viewTarget.status]}{viewTarget.status}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Risk Details</p>
                <p className="text-sm text-slate-700 leading-relaxed">{viewTarget.incidentDetails}</p>
              </div>
              {hasAdminReview(viewTarget) && (
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Mitigation Action</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{viewTarget.rca}</p>
                </div>
              )}
              {viewTarget.approvalStatus === 'Approved' && viewTarget.verifiedByName && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 text-sm text-emerald-800">
                  Verified by {viewTarget.verifiedByName}. Approved by {viewTarget.approvedByName || 'Amit Kumar Singh'}.
                </div>
              )}
            </div>
            <div className="px-6 pb-5 flex justify-end">
              {viewTarget.approvalStatus !== 'Approved' && (
                <button
                  onClick={() => { setEditTarget(viewTarget); setViewTarget(null); setFormOpen(true); }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit Risk
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
