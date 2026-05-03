export type ViewType = 'PIPELINE' | 'CLIENTS';

export type OpportunityType = 'SALES' | 'TAGGING' | 'PRODUCT';

export interface Client {
  id: string;
  name: string;
  gender: 'MALE' | 'FEMALE' | 'NON_BINARY';
  segment: 'UHNW' | 'HNW' | 'AFFLUENT' | 'RETAIL';
  totalWealth: number;
  riskTolerance: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
  lastContact: string;
  health: 'HEALTHY' | 'NEUTRAL' | 'AT_RISK';
  avatar: string;
  address: string;
}

export interface Activity {
  id: string;
  type: string;
  date: string;
  notes: string;
}

export interface HistoryEntry {
  id: string;
  type: 'STATUS_CHANGE' | 'EDIT' | 'CREATE';
  description: string;
  user: string;
  date: string;
}

export interface Opportunity {
  id: string;
  clientId: string;
  clientName?: string;
  clientAvatar?: string;
  clientAddress?: string;
  clientRiskTolerance?: string;
  clientHealth?: string;
  type: 'SALES' | 'TAGGING' | 'PRODUCT';
  title: string;
  stage: string;
  ownerAlias: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW' | 'WINNING' | 'MED';
  date: string;
  dynamicFields: any;
  activities: Activity[];
  history: HistoryEntry[];
}
