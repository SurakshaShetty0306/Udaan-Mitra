import { Customer, Transaction, PromiseRecord, Approval, ActivityLogItem } from '../types';

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'c_ramesh',
    name: 'Ramesh',
    phone: '+91 98451 22910',
    notes: 'Regular customer for daily kirana & dairy. Usually repays on Fridays or weekends.',
    avatarColor: 'from-amber-600 to-amber-700',
    createdAt: '2026-08-01',
  },
  {
    id: 'c_suresh',
    name: 'Suresh',
    phone: '+91 98765 43211',
    notes: 'Electrician down the street. Takes pulses, edible oil, and tea.',
    avatarColor: 'from-emerald-600 to-emerald-700',
    createdAt: '2026-08-10',
  },
  {
    id: 'c_meena',
    name: 'Meena',
    phone: '+91 98765 43212',
    notes: 'Primary school teacher. Monthly credit settlement.',
    avatarColor: 'from-rose-600 to-rose-700',
    createdAt: '2026-08-15',
  },
  {
    id: 'c_anand',
    name: 'Anand Kumar',
    phone: '+91 98223 99881',
    notes: 'Auto garage mechanic. Settles weekly on Sunday afternoons.',
    avatarColor: 'from-blue-600 to-blue-700',
    createdAt: '2026-08-20',
  },
  {
    id: 'c_priya',
    name: 'Priya Sharma',
    phone: '+91 98112 33445',
    notes: 'Apartment resident block 4. Consistent UPI settlements.',
    avatarColor: 'from-purple-600 to-purple-700',
    createdAt: '2026-08-22',
  },
];

// Transactions crafted to give Total Outstanding = ₹18,450
// Ramesh: Credit 2000 (earlier 3000-1000 prior = 2000 outstanding)
// Suresh: Credit 1500 (outstanding 1500)
// Meena: Credit 4500, Payment 1000 = 3500
// Anand: Credit 8500, Payment 2000 = 6500
// Priya: Credit 5450, Payment 500 = 4950
// Total = 2000 + 1500 + 3500 + 6500 + 4950 = 18,450! Exact match to prompt.

export const INITIAL_TRANSACTIONS: Transaction[] = [
  // Ramesh previous cycle:
  {
    id: 'tx_ramesh_past1',
    customer_id: 'c_ramesh',
    type: 'CREDIT',
    amount: 1500,
    transaction_date: '2026-09-02',
    note: 'Wheat flour 10kg, cooking oil 2L',
    created_at: '2026-09-02T11:00:00Z',
  },
  {
    id: 'tx_ramesh_past1_pay',
    customer_id: 'c_ramesh',
    type: 'PAYMENT',
    amount: 1500,
    transaction_date: '2026-09-06',
    note: 'Cash settled on time',
    created_at: '2026-09-06T18:00:00Z',
  },
  {
    id: 'tx_ramesh_past2',
    customer_id: 'c_ramesh',
    type: 'CREDIT',
    amount: 2500,
    transaction_date: '2026-09-08',
    note: 'Basmati rice, spices, sugar',
    created_at: '2026-09-08T10:30:00Z',
  },
  {
    id: 'tx_ramesh_past2_pay',
    customer_id: 'c_ramesh',
    type: 'PAYMENT',
    amount: 1500,
    transaction_date: '2026-09-17', // 5 days late from Sep 12 promise, partial
    note: 'Partial payment made (₹1,000 carried over then later settled)',
    created_at: '2026-09-17T17:00:00Z',
  },
  {
    id: 'tx_ramesh_past2_pay_rest',
    customer_id: 'c_ramesh',
    type: 'PAYMENT',
    amount: 1000,
    transaction_date: '2026-09-18',
    note: 'Remaining balance cleared',
    created_at: '2026-09-18T12:00:00Z',
  },
  // Ramesh current active credit:
  {
    id: 'tx_ramesh_current',
    customer_id: 'c_ramesh',
    type: 'CREDIT',
    amount: 2000,
    transaction_date: '2026-09-18',
    note: 'Daily groceries & dairy items',
    created_at: '2026-09-18T16:20:00Z',
  },

  // Suresh
  {
    id: 'tx_suresh_1',
    customer_id: 'c_suresh',
    type: 'CREDIT',
    amount: 1500,
    transaction_date: '2026-09-22',
    note: 'Pulses, tea powder & ghee',
    created_at: '2026-09-22T09:15:00Z',
  },

  // Meena
  {
    id: 'tx_meena_1',
    customer_id: 'c_meena',
    type: 'CREDIT',
    amount: 4500,
    transaction_date: '2026-09-12',
    note: 'Monthly groceries bundle',
    created_at: '2026-09-12T14:00:00Z',
  },
  {
    id: 'tx_meena_pay1',
    customer_id: 'c_meena',
    type: 'PAYMENT',
    amount: 1000,
    transaction_date: '2026-09-19',
    note: 'Partial payment made',
    created_at: '2026-09-19T18:30:00Z',
  },

  // Anand
  {
    id: 'tx_anand_1',
    customer_id: 'c_anand',
    type: 'CREDIT',
    amount: 8500,
    transaction_date: '2026-09-10',
    note: 'Shop supplies & household provisions',
    created_at: '2026-09-10T12:00:00Z',
  },
  {
    id: 'tx_anand_pay1',
    customer_id: 'c_anand',
    type: 'PAYMENT',
    amount: 2000,
    transaction_date: '2026-09-16',
    note: 'UPI transfer',
    created_at: '2026-09-16T19:00:00Z',
  },

  // Priya
  {
    id: 'tx_priya_1',
    customer_id: 'c_priya',
    type: 'CREDIT',
    amount: 5450,
    transaction_date: '2026-09-15',
    note: 'Dry fruits & gourmet snacks',
    created_at: '2026-09-15T15:00:00Z',
  },
  {
    id: 'tx_priya_pay1',
    customer_id: 'c_priya',
    type: 'PAYMENT',
    amount: 500,
    transaction_date: '2026-09-20',
    note: 'Cash token payment',
    created_at: '2026-09-20T17:15:00Z',
  },
];

// Ramesh history matches Section 4:
// Outstanding: ₹2,000
// Recent promises: 3
// Kept on time: 1
// Missed / late: 2
// Partial payments: 1
// Average delay: 5 days
export const INITIAL_PROMISES: PromiseRecord[] = [
  // Ramesh Past Promise 1: Kept on time
  {
    id: 'prom_ramesh_past1',
    customer_id: 'c_ramesh',
    transaction_id: 'tx_ramesh_past1',
    promised_amount: 1500,
    promise_date: '2026-09-06',
    status: 'FULFILLED',
    outcome: 'KEPT_ON_TIME',
    delay_days: 0,
    created_at: '2026-09-02T11:05:00Z',
    fulfilled_at: '2026-09-06T18:00:00Z',
    notes: 'Paid on Sunday as committed.',
  },
  // Ramesh Past Promise 2: Missed/Late + Partial payment (delayed by 5 days)
  {
    id: 'prom_ramesh_past2',
    customer_id: 'c_ramesh',
    transaction_id: 'tx_ramesh_past2',
    promised_amount: 2500,
    promise_date: '2026-09-12',
    status: 'FULFILLED',
    outcome: 'PAID_LATE',
    delay_days: 5,
    created_at: '2026-09-08T10:35:00Z',
    fulfilled_at: '2026-09-17T17:00:00Z',
    notes: 'Paid 5 days late. First paid ₹1,500 partially.',
  },
  // Ramesh Current Promise (due Friday Sep 20, now missed in the demo state!):
  {
    id: 'prom_ramesh_current',
    customer_id: 'c_ramesh',
    transaction_id: 'tx_ramesh_current',
    promised_amount: 2000,
    promise_date: 'Friday, Sep 20',
    status: 'MISSED',
    outcome: 'MISSED',
    delay_days: 4,
    created_at: '2026-09-18T16:25:00Z',
    notes: 'Promised to clear ₹2,000 on Friday after office salary.',
  },

  // Suresh: Due today ₹1,500
  {
    id: 'prom_suresh_1',
    customer_id: 'c_suresh',
    transaction_id: 'tx_suresh_1',
    promised_amount: 1500,
    promise_date: 'Today',
    status: 'DUE',
    outcome: 'PENDING',
    created_at: '2026-09-22T09:20:00Z',
    notes: 'Committed to pay after site job in the evening.',
  },

  // Meena: Due tomorrow ₹700 (or Friday)
  {
    id: 'prom_meena_1',
    customer_id: 'c_meena',
    transaction_id: 'tx_meena_1',
    promised_amount: 700,
    promise_date: 'Tomorrow, Friday',
    status: 'PENDING',
    outcome: 'PENDING',
    created_at: '2026-09-19T18:35:00Z',
    notes: 'Agreed on Friday installment after tutoring class.',
  },

  // Anand: Due Today ₹2,000
  {
    id: 'prom_anand_1',
    customer_id: 'c_anand',
    transaction_id: 'tx_anand_1',
    promised_amount: 2000,
    promise_date: 'Today',
    status: 'DUE',
    outcome: 'PENDING',
    created_at: '2026-09-16T19:05:00Z',
    notes: 'Pending payment due today evening.',
  },
];

// Initial Approvals: Exactly 2 awaiting approval as requested in Section 7
export const INITIAL_APPROVALS: Approval[] = [
  {
    id: 'app_ramesh_reminder_1',
    customer_id: 'c_ramesh',
    type: 'REMINDER',
    reason: "Ramesh missed today's promised payment of ₹2,000.",
    draft_content: 'Hi Ramesh, just a gentle reminder about the ₹2,000 payment you had planned to make today. Please let us know when convenient.',
    status: 'PENDING',
    created_at: '2026-09-24T09:00:00Z',
    metadata: {
      original_amount: 2000,
      phone: '+91 98451 22910',
      suggested_action: 'Send gentle reminder before extending any new credit',
      channel: 'WHATSAPP_SMS',
    },
  },
  {
    id: 'app_suresh_reminder_1',
    customer_id: 'c_suresh',
    type: 'REMINDER',
    reason: 'Suresh requested a polite settlement confirmation for his ₹1,500 commitment due today.',
    draft_content: 'Namaste Suresh ji, hope your day is going well. Just checking in on the ₹1,500 kirana payment scheduled for today evening.',
    status: 'PENDING',
    created_at: '2026-09-24T09:30:00Z',
    metadata: {
      original_amount: 1500,
      phone: '+91 98765 43211',
      suggested_action: 'Send friendly check-in before evening closing',
      channel: 'WHATSAPP_SMS',
    },
  },
];

export const INITIAL_ACTIVITIES: ActivityLogItem[] = [
  {
    id: 'act_1',
    customer_id: 'c_ramesh',
    event_type: 'REMINDER',
    description: "Reminder prepared because Ramesh's ₹2,000 promise was missed.",
    created_at: '2026-09-24T09:00:00Z',
    formatted_time: 'Today 9:00 AM',
  },
  {
    id: 'act_2',
    customer_id: 'c_ramesh',
    event_type: 'PROMISE',
    description: 'Promise marked MISSED: Ramesh did not settle ₹2,000 by Friday.',
    created_at: '2026-09-23T20:00:00Z',
    formatted_time: 'Yesterday 8:00 PM',
  },
  {
    id: 'act_3',
    customer_id: 'c_suresh',
    event_type: 'PROMISE',
    description: 'Suresh promised payment of ₹1,500 for Today.',
    created_at: '2026-09-22T09:20:00Z',
    formatted_time: 'Sep 22, 9:20 AM',
  },
  {
    id: 'act_4',
    customer_id: 'c_ramesh',
    event_type: 'TRANSACTION',
    description: '₹2,000 credit recorded for Ramesh (Groceries). Promise noted for Friday.',
    created_at: '2026-09-18T16:25:00Z',
    formatted_time: 'Sep 18, 4:25 PM',
  },
];
