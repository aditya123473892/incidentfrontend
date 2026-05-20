import { useState } from 'react';
import {
  Plus, Search, LogOut, Shield, Pencil, Trash2,
  ChevronUp, ChevronDown, Filter, AlertCircle, Clock,
  CheckCircle2, XCircle, BarChart3, X,
} from 'lucide-react';
import { Incident, Priority, Status, Emergency, Impact, RiskLevel } from '../types';
import IncidentForm from './IncidentForm';

interface DashboardProps {
  incidents: Incident[];
  userEmail: string;
  userRole?: string;
  onAdd: (incident: Incident) => void;
  onUpdate: (incident: Incident) => void;
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

const formatDateDDMMYYYYHyphen = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return String(dateString);

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const escapeExcelCell = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getRiskSignOffs = (incident: Incident) => ({
  createdBy: incident.createdBy || 'Sushil',
  updatedBy: incident.updatedBy || 'Dheeraj Adlakha',
  approvedBy: incident.approvedBy || 'Amit Kumar Singh',
});

const getRiskLikelihood = (incident: Incident): Emergency =>
  incident.likelihood ?? incident.emergency ?? 'Medium';

export default function Dashboard({
  incidents,
  userEmail,
  userRole,
  onAdd,
  onUpdate,
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
     const worksheetRows = filtered.map((incident) => {
       const signOffs = getRiskSignOffs(incident);

       return `
         <tr class="data-row">
           <td>${escapeExcelCell(incident.srNo)}</td>
           <td>${escapeExcelCell(incident.incidentRefNo)}</td>
           <td>${escapeExcelCell(formatDateDDMMYY(incident.incidentDate))}</td>
           <td class="left">${escapeExcelCell(incident.incidentDetails)}</td>
           <td>${escapeExcelCell(incident.incidentCategory)}</td>
           <td>${escapeExcelCell(incident.impact)}</td>
           <td>${escapeExcelCell(getRiskLikelihood(incident))}</td>
           <td>${escapeExcelCell(incident.priority)}</td>
           <td>${escapeExcelCell(incident.riskScore)}</td>
           <td>${escapeExcelCell(incident.status)}</td>
           <td class="left">${escapeExcelCell(incident.rca)}</td>
           <td>${escapeExcelCell(signOffs.createdBy)}</td>
           <td>${escapeExcelCell(signOffs.updatedBy)}</td>
           <td>${escapeExcelCell(signOffs.approvedBy)}</td>
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
             col.sr-no { width: 70px; }
             col.ref-no { width: 110px; }
             col.date { width: 100px; }
             col.description { width: 260px; }
             col.category { width: 120px; }
             col.rating { width: 120px; }
             col.score { width: 95px; }
             col.status { width: 120px; }
             col.rca { width: 225px; }
             col.signoff { width: 150px; }
             td { vertical-align: middle; text-align: center; padding: 4px 6px; }
             .title { height: 42px; font-weight: 700; font-size: 12pt; text-align: center; }
             .blank { height: 22px; }
             .header td { height: 40px; background: #8c8c8c; color: #000; font-weight: 700; border: 1px solid #000; }
             .data-row td { height: 58px; border: 1px solid #000; white-space: normal; }
             .left { text-align: left; }
             .gap td { height: 58px; }
             .signature-label td,
             .signature-name td,
             .signature-role td { height: 26px; font-weight: 700; text-align: left; }
             .signature-line td { height: 34px; color: #1f4fbf; font-family: "Segoe Script", "Brush Script MT", cursive; font-size: 16pt; text-align: left; }
           </style>
         </head>
         <body>
           <table>
             <colgroup>
               <col class="sr-no" />
               <col class="ref-no" />
               <col class="date" />
               <col class="description" />
               <col class="category" />
               <col class="rating" />
               <col class="rating" />
               <col class="rating" />
               <col class="score" />
               <col class="status" />
               <col class="rca" />
               <col class="signoff" />
               <col class="signoff" />
               <col class="signoff" />
             </colgroup>
             <tr><td class="title" colspan="14">Risk Management Table Data</td></tr>
             <tr><td class="blank" colspan="14"></td></tr>
             <tr class="header">
               <td>Sr. No.</td>
               <td>Ref No.</td>
               <td>Date</td>
               <td>Description</td>
               <td>Category</td>
               <td>Impact</td>
               <td>Likelihood</td>
               <td>Priority</td>
               <td>Risk Score</td>
               <td>Status</td>
               <td>RCA</td>
               <td>Created By</td>
               <td>Updated By</td>
               <td>Approved By</td>
             </tr>
             ${worksheetRows}
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
                   <td>${incident.incidentRefNo}</td>
                   <td>${formatDateDDMMYY(incident.incidentDate)}</td>
                   <td>${incident.incidentDetails}</td>
                   <td>${incident.incidentCategory}</td>
                   <td>${incident.impact}</td>
                   <td>${getRiskLikelihood(incident)}</td>
                   <td>${incident.priority}</td>
                   <td>${incident.riskScore}</td>
                   <td>${incident.status}</td>
                   <td>${incident.rca || ''}</td>
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
                  {[
                    { key: 'srNo', label: 'Sr. No.' },
                    { key: 'incidentRefNo', label: 'Ref No.' },
                    { key: 'incidentDate', label: 'Date' },
                    { key: 'incidentDetails', label: 'Description' },
                    { key: 'incidentCategory', label: 'Category' },
                    { key: 'impact', label: 'Impact' },
                    { key: 'likelihood', label: 'Likelihood' },
                    { key: 'priority', label: 'Priority' },
                    { key: 'riskScore', label: 'Risk Score' },
                    { key: 'status', label: 'Status' },
                    { key: 'rca', label: 'RCA' },
                    { key: 'createdBy', label: 'Created By' },
                    { key: 'updatedBy', label: 'Updated By' },
                    { key: 'approvedBy', label: 'Approved By' },
                  ].map(({ key, label }) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key as SortKey)}
                      className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer hover:text-slate-800 select-none whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1">
                        {label}
                        <SortIcon k={key as SortKey} />
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={15} className="px-4 py-12 text-center text-slate-400 text-sm">
                      No risks found. Adjust your filters or create a new risk.
                    </td>
                  </tr>
                ) : (
                  filtered.map((incident) => (
                    <tr
                      key={incident.id}
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      <td className="px-4 py-3.5 text-slate-500 font-mono text-xs">{incident.srNo}</td>
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => setViewTarget(incident)}
                          className="font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                        >
                          {incident.incidentRefNo}
                        </button>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                        {formatDateDDMMYY(incident.incidentDate)}
                      </td>
                      <td className="px-4 py-3.5 text-slate-700">
                        <p>{incident.incidentDetails}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-block bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-full font-medium">
                          {incident.incidentCategory}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-semibold ring-1 ${impactColors[incident.impact]}`}>
                          {incident.impact}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-semibold ring-1 ${emergencyColors[getRiskLikelihood(incident)]}`}>
                          {getRiskLikelihood(incident)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-semibold ring-1 ${priorityColors[incident.priority]}`}>
                          {incident.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-bold ring-1 ${riskLevelColors[incident.riskLevel]} border`}>
                          {incident.riskScore}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold ring-1 ${statusColors[incident.status]}`}>
                          {statusIcons[incident.status]}
                          {incident.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {incident.rca ? (
                          <p className="text-xs">{incident.rca}</p>
                        ) : (
                          <span className="text-slate-300 text-xs italic">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                        {getRiskSignOffs(incident).createdBy}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                        {getRiskSignOffs(incident).updatedBy}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                        {getRiskSignOffs(incident).approvedBy}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {userRole === 'admin' && (
                            <button
                              onClick={() => setDeleteConfirm(incident.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => { setEditTarget(incident); setFormOpen(true); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
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
                <h3 className="text-lg font-semibold">{viewTarget.incidentRefNo}</h3>
                <p className="text-slate-400 text-xs mt-0.5">Risk Detail View</p>
              </div>
              <button onClick={() => setViewTarget(null)} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: 'Sr. No.',          value: viewTarget.srNo },
                { label: 'Risk Ref No.',  value: viewTarget.incidentRefNo },
                { label: 'Risk Date',     value: new Date(viewTarget.incidentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) },
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
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ring-1 ${impactColors[viewTarget.impact]}`}>
                  {viewTarget.impact}
                </span>
              </div>
              <div className="py-2 border-b border-slate-50 flex items-center gap-3">
                <span className="text-sm font-medium text-slate-500 whitespace-nowrap">Risk Score</span>
                <span className="text-sm text-slate-800 font-bold">{viewTarget.riskScore} <span className="text-xs font-normal text-slate-400">({viewTarget.riskLevel})</span></span>
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
              {viewTarget.rca && (
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Root Cause Analysis</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{viewTarget.rca}</p>
                </div>
              )}
            </div>
            <div className="px-6 pb-5 flex justify-end">
              <button
                onClick={() => { setEditTarget(viewTarget); setViewTarget(null); setFormOpen(true); }}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit Risk
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
