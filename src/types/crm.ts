export type ContactType = 'investor' | 'company_owner' | 'intermediary' | 'advisor';
export type RelationshipWarmth = 'cold' | 'warm' | 'hot';
export type Level = 'low' | 'medium' | 'high';

export interface Contact {
  id: string;
  name: string;
  organization: string;
  role: string;
  emails: string[];
  phone?: string;
  geography: string;
  source: string;
  tags: string[];
  lastInteraction?: Date;
  notes: string;
  warmth: RelationshipWarmth;
  influenceLevel: Level;
  likelihood: Level;
  type: ContactType;
  linkedCompanyIds: string[];
  linkedDealIds: string[];
  createdAt: Date;
}

export type InvestorStage = 
  | 'not_contacted'
  | 'outreach_sent'
  | 'follow_up'
  | 'meeting_scheduled'
  | 'interested'
  | 'passed'
  | 'committed'
  | 'closed';

export interface InvestorDeal {
  id: string;
  contactId: string;
  contact?: Contact;
  stage: InvestorStage;
  targetAmount?: number;
  committedAmount?: number;
  notes: string;
  documents: Document[];
  activities: Activity[];
  createdAt: Date;
  updatedAt: Date;
}

export type DealStage = 
  | 'identified'
  | 'researching'
  | 'outreach_sent'
  | 'follow_up'
  | 'nda_sent'
  | 'nda_signed'
  | 'in_discussion'
  | 'passed'
  | 'due_diligence'
  | 'loi'
  | 'closed';

export interface Company {
  id: string;
  name: string;
  industry: string;
  revenue?: number;
  ebitda?: number;
  estimatedValuation?: number;
  ownerContactId?: string;
  geography: string;
  website?: string;
  notes: string;
  attractivenessScore: number;
  stage: DealStage;
  documents: Document[];
  activities: Activity[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  id: string;
  name: string;
  type: 'pitch_deck' | 'nda' | 'cim' | 'financials' | 'other';
  url: string;
  version: number;
  uploadedAt: Date;
  sharedWith: string[];
}

export interface Activity {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'note' | 'document' | 'stage_change';
  description: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface PassedDealReason {
  id: string;
  companyId: string;
  reason: 'sector' | 'size' | 'valuation' | 'owner' | 'strategic_mismatch' | 'other';
  notes: string;
  createdAt: Date;
}

export interface KPIMetrics {
  outreachSent: number;
  followUpsCompleted: number;
  meetingsBooked: number;
  ndasSigned: number;
  dealsAdvanced: number;
  investorConversations: number;
  responseRate: number;
  conversionRate: number;
}
