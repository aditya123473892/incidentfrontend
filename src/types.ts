export type Likelihood = 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';
export type Impact = 'Very Low' | 'Low' | 'Medium' | 'High' | 'Very High';
export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type Priority = 'Very low' | 'Low' | 'Medium' | 'High' | 'Very High';
export type Status = 'Open' | 'In Progress' | 'Resolved' | 'Closed';
export type Category =
  | 'Network'
  | 'Hardware'
  | 'Software'
  | 'Security'
  | 'Database'
  | 'Application'
  | 'Other';

export interface Incident {
  id: string;
  srNo: number;
  incidentRefNo: string;
  incidentDate: string;
  incidentDetails: string;
  incidentCategory: Category;
  likelihood: Likelihood;
  impact: Impact;
  riskScore: number;
  riskLevel: RiskLevel;
  priority: Priority;
  rca: string;
  status: Status;
}
