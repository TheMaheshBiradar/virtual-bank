/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Activity {
  id: string;
  type: 'CALL' | 'EMAIL' | 'MEETING' | 'TASK';
  date: string;
  notes: string;
}

export interface HistoryEntry {
  id: string;
  date: string;
  user: string;
  description: string;
  type: 'STATUS_CHANGE' | 'EDIT' | 'CREATE' | 'ACTIVITY';
}

export type OpportunityType = 'SALES' | 'TAGGING' | 'PRODUCT';

export interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'currency';
  options?: string[];
  required?: boolean;
  showOnCard?: boolean;
  isPrimary?: boolean;
}

export interface TypeMetadata {
  id: OpportunityType;
  label: string;
  color: string;
  icon: string;
  fields: FieldConfig[];
  allowedTransitions?: Record<string, string[]>; // Map of stage -> list of next allowed stages
}

export interface Opportunity {
  id: string;
  type: OpportunityType;
  title: string;
  stage: 'QUALIFY' | 'DEVELOP' | 'PROPOSE' | 'CLOSE';
  ownerAlias: string;
  priority: 'HIGH' | 'MED' | 'LOW' | 'WINNING';
  date: string;
  ownerColor?: string;
  activities?: Activity[];
  history?: HistoryEntry[];
  [key: string]: any; // Allow dynamic fields based on type
}

export const OPPORTUNITY_TYPES: Record<OpportunityType, TypeMetadata> = {} as any;
export const MOCK_OPPORTUNITIES: Opportunity[] = [];
export const STAGES: any[] = [];

export type UserRole = 'ADMIN' | 'MANAGER' | 'SALES_REP';

export interface User {
  id: string;
  name: string;
  alias: string;
  role: UserRole;
  color: string;
  email: string;
  address?: string;
}

export interface Stage {
  id: string;
  label: string;
  count?: number;
  total?: string;
}

export const USERS: User[] = [];
