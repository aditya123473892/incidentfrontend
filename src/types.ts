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

export interface Incident {
  id: string;
  srNo: number;
  incidentRefNo: string;
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
