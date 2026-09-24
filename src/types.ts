export type TransactionType = 'CREDIT' | 'PAYMENT';

export type PromiseStatus = 'PENDING' | 'DUE' | 'MISSED' | 'FULFILLED';

export type PromiseOutcome = 'PENDING' | 'KEPT_ON_TIME' | 'PAID_LATE' | 'PARTIALLY_PAID' | 'MISSED';

export type ApprovalType = 'REMINDER' | 'CREDIT_RECOMMENDATION';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'EDITED' | 'SKIPPED';

export type RecommendationLevel = 'GREEN' | 'AMBER' | 'RED';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  notes?: string;
  avatarColor: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  customer_id: string;
  type: TransactionType;
  amount: number;
  transaction_date: string;
  note: string;
  created_at: string;
}

export interface PromiseRecord {
  id: string;
  customer_id: string;
  transaction_id?: string;
  promised_amount: number;
  promise_date: string;
  status: PromiseStatus;
  outcome: PromiseOutcome;
  delay_days?: number;
  created_at: string;
  fulfilled_at?: string;
  notes?: string;
}

export interface ApprovalMetadata {
  requested_amount?: number;
  original_amount?: number;
  approved_amount?: number;
  level?: RecommendationLevel;
  evidence?: string[];
  suggested_action?: string;
  phone?: string;
  channel?: 'WHATSAPP_SMS' | 'IN_PERSON';
}

export interface Approval {
  id: string;
  customer_id: string;
  type: ApprovalType;
  reason: string;
  draft_content: string;
  status: ApprovalStatus;
  created_at: string;
  approved_at?: string;
  decision_notes?: string;
  metadata?: ApprovalMetadata;
}

export interface ActivityLogItem {
  id: string;
  customer_id: string;
  event_type: 'TRANSACTION' | 'PROMISE' | 'APPROVAL' | 'REMINDER' | 'SYSTEM' | 'RECOMMENDATION';
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
  formatted_time: string;
}

export interface ParsedAgentIntent {
  raw_input: string;
  intent_type: 'NEW_CREDIT_PROMISE' | 'RECORD_PAYMENT' | 'NEW_PROMISE_ONLY' | 'CREDIT_REQUEST' | 'GENERAL_QUERY';
  customer_id: string;
  customer_name: string;
  amount?: number;
  promise_date?: string;
  item_note?: string;
  explanation: string;
  confidence: number;
}
