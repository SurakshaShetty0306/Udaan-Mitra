import { Customer, Transaction, PromiseRecord, Approval, ActivityLogItem } from '../types';
import {
  INITIAL_CUSTOMERS,
  INITIAL_TRANSACTIONS,
  INITIAL_PROMISES,
  INITIAL_APPROVALS,
  INITIAL_ACTIVITIES,
} from './initialData';

const DB_KEY_CUSTOMERS = 'udhaar_mitra_customers_v4';
const DB_KEY_TRANSACTIONS = 'udhaar_mitra_transactions_v4';
const DB_KEY_PROMISES = 'udhaar_mitra_promises_v4';
const DB_KEY_APPROVALS = 'udhaar_mitra_approvals_v4';
const DB_KEY_ACTIVITIES = 'udhaar_mitra_activities_v4';

export function loadStoredCustomers(): Customer[] {
  try {
    const saved = localStorage.getItem(DB_KEY_CUSTOMERS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load customers from storage:', e);
  }
  saveStoredCustomers(INITIAL_CUSTOMERS);
  return INITIAL_CUSTOMERS;
}

export function saveStoredCustomers(customers: Customer[]): void {
  try {
    localStorage.setItem(DB_KEY_CUSTOMERS, JSON.stringify(customers));
  } catch (e) {
    console.warn('Failed to save customers to storage:', e);
  }
}

export function loadStoredTransactions(): Transaction[] {
  try {
    const saved = localStorage.getItem(DB_KEY_TRANSACTIONS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load transactions from storage:', e);
  }
  saveStoredTransactions(INITIAL_TRANSACTIONS);
  return INITIAL_TRANSACTIONS;
}

export function saveStoredTransactions(transactions: Transaction[]): void {
  try {
    localStorage.setItem(DB_KEY_TRANSACTIONS, JSON.stringify(transactions));
  } catch (e) {
    console.warn('Failed to save transactions to storage:', e);
  }
}

export function loadStoredPromises(): PromiseRecord[] {
  try {
    const saved = localStorage.getItem(DB_KEY_PROMISES);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load promises from storage:', e);
  }
  saveStoredPromises(INITIAL_PROMISES);
  return INITIAL_PROMISES;
}

export function saveStoredPromises(promises: PromiseRecord[]): void {
  try {
    localStorage.setItem(DB_KEY_PROMISES, JSON.stringify(promises));
  } catch (e) {
    console.warn('Failed to save promises to storage:', e);
  }
}

export function loadStoredApprovals(): Approval[] {
  try {
    const saved = localStorage.getItem(DB_KEY_APPROVALS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load approvals from storage:', e);
  }
  saveStoredApprovals(INITIAL_APPROVALS);
  return INITIAL_APPROVALS;
}

export function saveStoredApprovals(approvals: Approval[]): void {
  try {
    localStorage.setItem(DB_KEY_APPROVALS, JSON.stringify(approvals));
  } catch (e) {
    console.warn('Failed to save approvals to storage:', e);
  }
}

export function loadStoredActivities(): ActivityLogItem[] {
  try {
    const saved = localStorage.getItem(DB_KEY_ACTIVITIES);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load activities from storage:', e);
  }
  saveStoredActivities(INITIAL_ACTIVITIES);
  return INITIAL_ACTIVITIES;
}

export function saveStoredActivities(activities: ActivityLogItem[]): void {
  try {
    localStorage.setItem(DB_KEY_ACTIVITIES, JSON.stringify(activities));
  } catch (e) {
    console.warn('Failed to save activities to storage:', e);
  }
}

export function resetDatabaseToDefault() {
  try {
    localStorage.removeItem(DB_KEY_CUSTOMERS);
    localStorage.removeItem(DB_KEY_TRANSACTIONS);
    localStorage.removeItem(DB_KEY_PROMISES);
    localStorage.removeItem(DB_KEY_APPROVALS);
    localStorage.removeItem(DB_KEY_ACTIVITIES);
  } catch (e) {}
}
