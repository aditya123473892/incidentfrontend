export type Emergency = 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';
export type Impact = 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';
export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';
export type Status = 'Open' | 'In Progress' | 'Resolved' | 'Closed';
export type Category =
  | 'Network'
  | 'Hardware'
  | 'Software'
  | 'Security'
  | 'Database'
  | 'Application'
  | 'Other';

export type Urgency = 'Low' | 'Medium' | 'High';

export interface SystemUser {
  id: number;
  email: string;
  fullName: string;
  role: string;
}

export interface Incident {
  id: string;
  srNo: number;
  incidentRefNo: string;
  clientName?: 'Pristine Group' | 'Elogisol Internal';
  incidentDate: string;
  incidentDetails: string;
  incidentCategory: Category;
  likelihood: Emergency;
  emergency?: Emergency;
  impact: Impact;
  riskScore: number;
  riskLevel: RiskLevel;
  priority: Priority;
  rca: string;
  status: Status;
  supportingDocName?: string;
  supportingDocMime?: string;
  adminSupportingDocName?: string;
  adminSupportingDocMime?: string;
  createdByEmail?: string;
  createdByName?: string;
  approvalStatus?: 'Pending' | 'Approved';
  verifiedByEmail?: string;
  verifiedByName?: string;
  approvedByEmail?: string;
  approvedByName?: string;
  approvedAt?: string;
  pendingSupportingDoc?: File | null;
}

export interface IncidentManagement {
  id: string;
  srNo: number;
  incidentRefNo: string;
  incidentDate: string;
  incidentDetails: string;
  incidentCategory: Category;
  priority: Priority;
  impact: Impact;
  urgency: Urgency;
  responseTarget: number;
  resolutionTarget: number;
  rca: string;
  status: Status;
}
