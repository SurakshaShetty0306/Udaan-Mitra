import React, { useState, useEffect } from 'react';
import {
  Customer,
  Transaction,
  PromiseRecord,
  Approval,
  ActivityLogItem,
  ParsedAgentIntent,
} from './types';
import {
  loadStoredCustomers,
  saveStoredCustomers,
  loadStoredTransactions,
  saveStoredTransactions,
  loadStoredPromises,
  saveStoredPromises,
  loadStoredApprovals,
  saveStoredApprovals,
  loadStoredActivities,
  saveStoredActivities,
  resetDatabaseToDefault,
} from './data/database';
import {
  INITIAL_CUSTOMERS,
  INITIAL_TRANSACTIONS,
  INITIAL_PROMISES,
  INITIAL_APPROVALS,
  INITIAL_ACTIVITIES,
} from './data/initialData';
import {
  calculateCustomerMetrics,
  evaluateCreditRecommendation,
} from './utils/engine';
import {
  LanguageCode,
  TRANSLATIONS,
} from './utils/i18n';

import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { TopHeader } from './components/TopHeader';
import { DemoControllerBar } from './components/DemoControllerBar';
import { DashboardView } from './components/DashboardView';
import { CustomersView } from './components/CustomersView';
import { PromisesView } from './components/PromisesView';
import { ApprovalsView } from './components/ApprovalsView';
import { ActivityView } from './components/ActivityView';
import { VoiceTextAgentModal } from './components/VoiceTextAgentModal';
import { Mic, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Default to Kannada as requested by the user ("see and one more if i select kannada whole website should be in kannada onlyy")
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('kn');
  const t = TRANSLATIONS[selectedLanguage];

  // Persistent State loaded from database
  const [customers, setCustomers] = useState<Customer[]>(() => loadStoredCustomers());
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadStoredTransactions());
  const [promises, setPromises] = useState<PromiseRecord[]>(() => loadStoredPromises());
  const [approvals, setApprovals] = useState<Approval[]>(() => loadStoredApprovals());
  const [activities, setActivities] = useState<ActivityLogItem[]>(() => loadStoredActivities());

  // Save changes to database whenever state changes
  useEffect(() => {
    saveStoredCustomers(customers);
  }, [customers]);

  useEffect(() => {
    saveStoredTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    saveStoredPromises(promises);
  }, [promises]);

  useEffect(() => {
    saveStoredApprovals(approvals);
  }, [approvals]);

  useEffect(() => {
    saveStoredActivities(activities);
  }, [activities]);

  // Agent Modal State
  const [isAgentOpen, setIsAgentOpen] = useState<boolean>(false);
  const [agentInitialMode, setAgentInitialMode] = useState<'VOICE' | 'TEXT'>('VOICE');
  const [agentPrefilledPrompt, setAgentPrefilledPrompt] = useState<string>('');

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const addActivity = (
    customerId: string,
    eventType: ActivityLogItem['event_type'],
    description: string,
    metadata?: Record<string, any>
  ) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newAct: ActivityLogItem = {
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      customer_id: customerId,
      event_type: eventType,
      description,
      metadata,
      created_at: now.toISOString(),
      formatted_time: `${selectedLanguage === 'kn' ? 'ಇಂದು' : 'Today'} ${timeStr}`,
    };

    setActivities((prev) => [newAct, ...prev]);
  };

  const handleOpenAgent = (mode: 'VOICE' | 'TEXT' = 'VOICE', prompt: string = '') => {
    setAgentInitialMode(mode);
    setAgentPrefilledPrompt(prompt);
    setIsAgentOpen(true);
  };

  // Helper to ensure customer exists or create a new customer dynamically with ANY name
  const ensureCustomerExists = (name: string, customerId?: string): Customer => {
    const existing = customers.find((c) =>
      c.id === customerId || c.name.toLowerCase() === name.toLowerCase()
    );

    if (existing) return existing;

    // Create a brand new customer dynamically
    const newCust: Customer = {
      id: customerId || `c_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`,
      name: name.trim(),
      phone: '+91 9' + Math.floor(100000000 + Math.random() * 900000000),
      notes: selectedLanguage === 'kn' ? 'ಖಾತಾದಲ್ಲಿ ಹೊಸದಾಗಿ ಸೇರಿಸಲಾದ ಗ್ರಾಹಕರು' : 'Newly added customer via Udhaar Mitra Agent',
      avatarColor: 'from-teal-600 to-teal-700',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setCustomers((prev) => [newCust, ...prev]);
    return newCust;
  };

  // --- CONFIRMED AGENT INTENT HANDLER ---
  const handleConfirmIntent = (intent: ParsedAgentIntent) => {
    const customer = ensureCustomerExists(intent.customer_name, intent.customer_id);

    if (intent.intent_type === 'NEW_CREDIT_PROMISE') {
      const amount = intent.amount || 2000;
      const promiseDay = intent.promise_date || (selectedLanguage === 'kn' ? 'ಶುಕ್ರವಾರ' : 'Friday');
      const txId = `tx_${Date.now()}`;

      const newTx: Transaction = {
        id: txId,
        customer_id: customer.id,
        type: 'CREDIT',
        amount,
        transaction_date: new Date().toISOString().split('T')[0],
        note: intent.item_note || (selectedLanguage === 'kn' ? 'ದಿನಸಿ ಸಾಲ' : 'Groceries on credit'),
        created_at: new Date().toISOString(),
      };

      const newPromise: PromiseRecord = {
        id: `prom_${Date.now()}`,
        customer_id: customer.id,
        transaction_id: txId,
        promised_amount: amount,
        promise_date: promiseDay,
        status: 'PENDING',
        outcome: 'PENDING',
        created_at: new Date().toISOString(),
        notes: selectedLanguage === 'kn' ? `${promiseDay} ರಂದು ಹಣ ಕೊಡುವ ಬದ್ಧತೆ.` : `Committed payment for ${promiseDay}.`,
      };

      setTransactions((prev) => [newTx, ...prev]);
      setPromises((prev) => [newPromise, ...prev]);

      addActivity(
        customer.id,
        'TRANSACTION',
        selectedLanguage === 'kn'
          ? `${customer.name} ಅವರಿಗೆ ₹${amount.toLocaleString('en-IN')} ಸಾಲ ದಾಖಲಿಸಲಾಗಿದೆ. ${promiseDay} ರಂದು ಪಾವತಿ ಭರವಸೆ ನೀಡಿದ್ದಾರೆ.`
          : `₹${amount.toLocaleString('en-IN')} credit recorded for ${customer.name}. Payment promised for ${promiseDay}.`
      );

      showToast(
        selectedLanguage === 'kn'
          ? `${customer.name}: ₹${amount.toLocaleString('en-IN')} ಸಾಲ ಮತ್ತು ಭರವಸೆ ಉಳಿಸಲಾಗಿದೆ!`
          : `Credit ₹${amount.toLocaleString('en-IN')} & promise saved for ${customer.name}!`
      );
    } else if (intent.intent_type === 'RECORD_PAYMENT') {
      const amount = intent.amount || 1000;

      const newTx: Transaction = {
        id: `tx_${Date.now()}`,
        customer_id: customer.id,
        type: 'PAYMENT',
        amount,
        transaction_date: new Date().toISOString().split('T')[0],
        note: selectedLanguage === 'kn' ? 'ಅಂಗಡಿಯಲ್ಲಿ ನಗದು ಪಾವತಿ' : 'Customer payment received at shop',
        created_at: new Date().toISOString(),
      };

      setPromises((prev) =>
        prev.map((p) => {
          if (p.customer_id === customer.id && (p.status === 'MISSED' || p.status === 'PENDING' || p.status === 'DUE')) {
            const isPartial = amount < p.promised_amount;
            return {
              ...p,
              status: 'FULFILLED',
              outcome: isPartial ? 'PARTIALLY_PAID' : 'KEPT_ON_TIME',
              delay_days: p.status === 'MISSED' ? 3 : 0,
              fulfilled_at: new Date().toISOString(),
            };
          }
          return p;
        })
      );

      setTransactions((prev) => [newTx, ...prev]);

      addActivity(
        customer.id,
        'TRANSACTION',
        selectedLanguage === 'kn'
          ? `${customer.name} ಅವರಿಂದ ₹${amount.toLocaleString('en-IN')} ಪಾವತಿ ದಾಖಲಿಸಲಾಗಿದೆ. ಭರವಸೆ ಸ್ಥಿತಿ ಭಾಗಶಃ ಪಾವತಿಗೆ ನವೀಕರಿಸಲಾಗಿದೆ.`
          : `₹${amount.toLocaleString('en-IN')} payment recorded from ${customer.name}. Promise outcome updated to PARTIALLY_PAID.`
      );

      showToast(
        selectedLanguage === 'kn'
          ? `${customer.name} ಅವರಿಂದ ₹${amount.toLocaleString('en-IN')} ಪಾವತಿ ದಾಖಲಾಗಿದೆ!`
          : `Recorded ₹${amount.toLocaleString('en-IN')} payment from ${customer.name}!`
      );
    } else if (intent.intent_type === 'NEW_PROMISE_ONLY') {
      const promiseDay = intent.promise_date || (selectedLanguage === 'kn' ? 'ಸೋಮವಾರ' : 'Monday');
      const newPromise: PromiseRecord = {
        id: `prom_${Date.now()}`,
        customer_id: customer.id,
        promised_amount: intent.amount || 1000,
        promise_date: promiseDay,
        status: 'PENDING',
        outcome: 'PENDING',
        created_at: new Date().toISOString(),
        notes: selectedLanguage === 'kn' ? `ಹೊಸ ಬದ್ಧತೆ: ${promiseDay} ರಂದು ಪಾವತಿಸುವುದಾಗಿ ಭರವಸೆ.` : `New commitment: Promised to pay ${promiseDay}.`,
      };

      setPromises((prev) => [newPromise, ...prev]);

      addActivity(
        customer.id,
        'PROMISE',
        selectedLanguage === 'kn'
          ? `${customer.name} ಅವರು ${promiseDay} ರಂದು ಹಣ ನೀಡುವುದಾಗಿ ಭರವಸೆ ನೀಡಿದ್ದಾರೆ.`
          : `${customer.name} promised payment for ${promiseDay}.`
      );

      showToast(
        selectedLanguage === 'kn'
          ? `${customer.name}: ${promiseDay} ದಿನಾಂಕದ ಭರವಸೆ ದಾಖಲಾಗಿದೆ!`
          : `New promise for ${promiseDay} recorded for ${customer.name}!`
      );
    } else if (intent.intent_type === 'CREDIT_REQUEST') {
      const amount = intent.amount || 3000;
      handleTriggerCreditEvaluation(customer, amount);
    }
  };

  const handleTriggerCreditEvaluation = (customer: Customer, amount: number) => {
    const metrics = calculateCustomerMetrics(customer.id, transactions, promises);
    const evaluation = evaluateCreditRecommendation(customer, amount, metrics);

    const newApproval: Approval = {
      id: `app_credit_${Date.now()}`,
      customer_id: customer.id,
      type: 'CREDIT_RECOMMENDATION',
      reason: selectedLanguage === 'kn'
        ? `ಗ್ರಾಹಕರು ₹${amount.toLocaleString('en-IN')} ಹೊಸ ಸಾಲ ಕೋರಿದ್ದಾರೆ. ಹಳೆಯ ಬಾಕಿ: ₹${metrics.outstanding.toLocaleString('en-IN')}.`
        : `Customer requested ₹${amount.toLocaleString('en-IN')} new credit. Outstanding balance: ₹${metrics.outstanding.toLocaleString('en-IN')}.`,
      draft_content: evaluation.suggestedAction,
      status: 'PENDING',
      created_at: new Date().toISOString(),
      metadata: {
        requested_amount: amount,
        original_amount: amount,
        level: evaluation.level,
        evidence: evaluation.reasons,
        suggested_action: evaluation.suggestedAction,
      },
    };

    setApprovals((prev) => [newApproval, ...prev]);

    addActivity(
      customer.id,
      'RECOMMENDATION',
      selectedLanguage === 'kn'
        ? `AI ${customer.name} ಅವರಿಗೆ ${evaluation.level} ಸಾಲ ಮೌಲ್ಯಮಾಪನ ಸಿದ್ಧಪಡಿಸಿದೆ (ಕೋರಿದ್ದು: ₹${amount.toLocaleString('en-IN')}).`
        : `AI generated ${evaluation.level} credit recommendation for ${customer.name} (₹${amount.toLocaleString('en-IN')} requested). Awaiting approval.`,
      { level: evaluation.level }
    );

    setActiveTab('approvals');
    showToast(selectedLanguage === 'kn' ? 'ಹೊಸ ಸಾಲದ ಶಿಫಾರಸು ಸಿದ್ಧವಾಗಿದೆ!' : `Credit recommendation generated for ${customer.name}!`);
  };

  // --- APPROVAL ACTIONS ---
  const handleApproveReminder = (approvalId: string) => {
    setApprovals((prev) =>
      prev.map((a) => {
        if (a.id === approvalId) {
          return {
            ...a,
            status: 'APPROVED',
            approved_at: new Date().toISOString(),
            decision_notes: selectedLanguage === 'kn' ? 'ಜ್ಞಾಪನೆ ಅಂಗಡಿಯವರಿಂದ ಅನುಮೋದಿಸಿ ಕಳುಹಿಸಲಾಗಿದೆ.' : 'Reminder approved and dispatched to customer.',
          };
        }
        return a;
      })
    );

    const targetApp = approvals.find((a) => a.id === approvalId);
    if (targetApp) {
      const customer = customers.find((c) => c.id === targetApp.customer_id);
      addActivity(
        targetApp.customer_id,
        'APPROVAL',
        selectedLanguage === 'kn'
          ? `ಜ್ಞಾಪನೆ ಅನುಮೋದಿಸಿ ${customer?.name || 'ಗ್ರಾಹಕರಿಗೆ'} ಕಳುಹಿಸಲಾಗಿದೆ: “${targetApp.draft_content}”`
          : `Reminder approved and sent to ${customer?.name || 'Customer'}: “${targetApp.draft_content}”`
      );
    }

    showToast(selectedLanguage === 'kn' ? 'ಜ್ಞಾಪನೆ ಅನುಮೋದಿಸಿ ಕಳುಹಿಸಲಾಗಿದೆ!' : 'Reminder approved & sent!');
  };

  const handleEditReminderDraft = (approvalId: string, updatedDraft: string) => {
    setApprovals((prev) =>
      prev.map((a) => {
        if (a.id === approvalId) {
          return {
            ...a,
            status: 'EDITED',
            draft_content: updatedDraft,
            approved_at: new Date().toISOString(),
            decision_notes: 'Shopkeeper customized draft and sent.',
          };
        }
        return a;
      })
    );

    const targetApp = approvals.find((a) => a.id === approvalId);
    if (targetApp) {
      const customer = customers.find((c) => c.id === targetApp.customer_id);
      addActivity(
        targetApp.customer_id,
        'APPROVAL',
        `Customized reminder sent to ${customer?.name || 'Customer'}: “${updatedDraft}”`
      );
    }

    showToast(selectedLanguage === 'kn' ? 'ತಿದ್ದುಪಡಿ ಮಾಡಿದ ಜ್ಞಾಪನೆ ಕಳುಹಿಸಲಾಗಿದೆ!' : 'Customized reminder sent!');
  };

  const handleSkipReminder = (approvalId: string) => {
    setApprovals((prev) =>
      prev.map((a) => {
        if (a.id === approvalId) {
          return {
            ...a,
            status: 'SKIPPED',
            approved_at: new Date().toISOString(),
            decision_notes: 'Shopkeeper skipped reminder.',
          };
        }
        return a;
      })
    );

    const targetApp = approvals.find((a) => a.id === approvalId);
    if (targetApp) {
      addActivity(
        targetApp.customer_id,
        'APPROVAL',
        selectedLanguage === 'kn' ? 'ಜ್ಞಾಪನೆ ಪ್ರಸ್ತಾವನೆಯನ್ನು ಬಿಟ್ಟುಬಿಡಲಾಗಿದೆ.' : `Reminder proposal skipped by shopkeeper.`
      );
    }

    showToast(selectedLanguage === 'kn' ? 'ಜ್ಞಾಪನೆ ಬಿಟ್ಟುಬಿಡಲಾಗಿದೆ.' : 'Reminder skipped.');
  };

  const handleApproveCredit = (approvalId: string, approvedAmount: number) => {
    setApprovals((prev) =>
      prev.map((a) => {
        if (a.id === approvalId) {
          return {
            ...a,
            status: 'APPROVED',
            approved_at: new Date().toISOString(),
            decision_notes: `Shopkeeper approved credit extension of ₹${approvedAmount.toLocaleString('en-IN')}.`,
          };
        }
        return a;
      })
    );

    const targetApp = approvals.find((a) => a.id === approvalId);
    if (targetApp) {
      const customer = customers.find((c) => c.id === targetApp.customer_id);

      const newTx: Transaction = {
        id: `tx_${Date.now()}`,
        customer_id: targetApp.customer_id,
        type: 'CREDIT',
        amount: approvedAmount,
        transaction_date: new Date().toISOString().split('T')[0],
        note: selectedLanguage === 'kn' ? 'ಅಂಗಡಿಯವರಿಂದ ಅನುಮೋದಿತ ಸಾಲ' : 'Approved credit extension',
        created_at: new Date().toISOString(),
      };

      setTransactions((prev) => [newTx, ...prev]);

      addActivity(
        targetApp.customer_id,
        'APPROVAL',
        selectedLanguage === 'kn'
          ? `${customer?.name} ಅವರಿಗೆ ₹${approvedAmount.toLocaleString('en-IN')} ಸಾಲ ಅಂಗಡಿಯವರಿಂದ ಮಂಜೂರಾಗಿದೆ.`
          : `Credit of ₹${approvedAmount.toLocaleString('en-IN')} approved by shopkeeper for ${customer?.name || 'Customer'}.`
      );
    }

    showToast(
      selectedLanguage === 'kn'
        ? `₹${approvedAmount.toLocaleString('en-IN')} ಸಾಲ ಯಶಸ್ವಿಯಾಗಿ ಮಂಜೂರಾಗಿದೆ!`
        : `Credit ₹${approvedAmount.toLocaleString('en-IN')} approved by shopkeeper!`
    );
  };

  const handleDenyCredit = (approvalId: string) => {
    setApprovals((prev) =>
      prev.map((a) => {
        if (a.id === approvalId) {
          return {
            ...a,
            status: 'SKIPPED',
            approved_at: new Date().toISOString(),
            decision_notes: 'Shopkeeper declined credit extension based on review.',
          };
        }
        return a;
      })
    );

    const targetApp = approvals.find((a) => a.id === approvalId);
    if (targetApp) {
      const customer = customers.find((c) => c.id === targetApp.customer_id);
      addActivity(
        targetApp.customer_id,
        'APPROVAL',
        selectedLanguage === 'kn'
          ? `${customer?.name} ಅವರ ಸಾಲದ ವಿನಂತಿಯನ್ನು ತಿರಸ್ಕರಿಸಲಾಗಿದೆ.`
          : `Credit request declined by shopkeeper for ${customer?.name || 'Customer'}.`
      );
    }

    showToast(selectedLanguage === 'kn' ? 'ಸಾಲದ ವಿನಂತಿ ತಿರಸ್ಕರಿಸಲಾಗಿದೆ.' : 'Credit request declined by shopkeeper.');
  };

  // --- FAST DEMO ACTIONS ---
  const handleSimulateMissedPromise = () => {
    setPromises((prev) =>
      prev.map((p) => {
        if (p.customer_id === 'c_ramesh' && (p.status === 'PENDING' || p.status === 'DUE')) {
          return { ...p, status: 'MISSED', outcome: 'MISSED', delay_days: 4 };
        }
        return p;
      })
    );

    const existingReminder = approvals.find(
      (a) => a.customer_id === 'c_ramesh' && a.type === 'REMINDER' && a.status === 'PENDING'
    );

    if (!existingReminder) {
      const newReminder: Approval = {
        id: `app_rem_${Date.now()}`,
        customer_id: 'c_ramesh',
        type: 'REMINDER',
        reason: selectedLanguage === 'kn'
          ? 'ರಮೇಶ್ ಅವರು ಇಂದಿನ ₹2,000 ಪಾವತಿ ಭರವಸೆಯನ್ನು ತಪ್ಪಿದ್ದಾರೆ.'
          : "Ramesh missed today's promised payment of ₹2,000.",
        draft_content: selectedLanguage === 'kn'
          ? 'ನಮಸ್ಕಾರ ರಮೇಶ್ ಅವರೇ, ಇಂದು ನೀವು ಪಾವತಿಸುವುದಾಗಿ ತಿಳಿಸಿದ್ದ ₹2,000 ಬಗ್ಗೆ ಸೌಮ್ಯ ಜ್ಞಾಪನೆ. ಅನುಕೂಲವಾದಾಗ ದಯವಿಟ್ಟು ತಿಳಿಸಿ.'
          : 'Hi Ramesh, just a gentle reminder about the ₹2,000 payment you had planned to make today. Please let us know when convenient.',
        status: 'PENDING',
        created_at: new Date().toISOString(),
        metadata: {
          original_amount: 2000,
          suggested_action: selectedLanguage === 'kn' ? 'ಹೊಸ ಸಾಲ ನೀಡುವ ಮುನ್ನ ಸೌಮ್ಯ ಜ್ಞಾಪನೆ ಕಳುಹಿಸಿ' : 'Send gentle reminder before extending any new credit',
        },
      };
      setApprovals((prev) => [newReminder, ...prev]);
    }

    addActivity(
      'c_ramesh',
      'REMINDER',
      selectedLanguage === 'kn'
        ? 'ಶುಕ್ರವಾರ ಯಾವುದೇ ಪಾವತಿಯಿಲ್ಲದೆ ಕಳೆಯಿತು. ಸೌಮ್ಯ ಜ್ಞಾಪನೆ ಅಂಗಡಿಯವರ ಅನುಮೋದನೆಗೆ ಸಿದ್ಧವಾಗಿದೆ.'
        : "Promise missed: Friday arrived without payment from Ramesh. Gentle reminder prepared awaiting shopkeeper approval."
    );

    setActiveTab('approvals');
    showToast(selectedLanguage === 'kn' ? 'ಶುಕ್ರವಾರ ಪಾವತಿ ತಪ್ಪಿದೆ: ಜ್ಞಾಪನೆ ಸಿದ್ಧವಾಗಿದೆ!' : "Simulated Friday: Ramesh's promise missed! Reminder prepared in Approvals.");
  };

  const handleSimulatePayment = () => {
    handleConfirmIntent({
      raw_input: selectedLanguage === 'kn' ? 'ರಮೇಶ್ ₹1,000 ಕೊಟ್ಟಿದ್ದಾರೆ.' : 'Ramesh paid ₹1,000.',
      intent_type: 'RECORD_PAYMENT',
      customer_id: 'c_ramesh',
      customer_name: 'Ramesh',
      amount: 1000,
      explanation: '₹1,000 payment received from Ramesh',
      confidence: 0.98,
    });
  };

  const handleSimulateNewPromise = () => {
    handleConfirmIntent({
      raw_input: selectedLanguage === 'kn' ? 'ರಮೇಶ್ ಸೋಮವಾರ ಹಣ ಕೊಡ್ತೀನಿ ಎಂದಿದ್ದಾರೆ.' : "Ramesh said he'll pay Monday.",
      intent_type: 'NEW_PROMISE_ONLY',
      customer_id: 'c_ramesh',
      customer_name: 'Ramesh',
      promise_date: selectedLanguage === 'kn' ? 'ಸೋಮವಾರ' : 'Monday',
      amount: 1000,
      explanation: 'New commitment for Monday from Ramesh',
      confidence: 0.98,
    });
  };

  const handleAddNewCustomerDirect = (name: string, phone: string, notes: string) => {
    const newCust: Customer = {
      id: `c_${name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`,
      name: name.trim(),
      phone: phone.trim() || ('+91 9' + Math.floor(100000000 + Math.random() * 900000000)),
      notes: notes.trim() || (selectedLanguage === 'kn' ? 'ಖಾತೆ ಗ್ರಾಹಕರು' : 'Khata account holder'),
      avatarColor: 'from-emerald-600 to-teal-700',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setCustomers((prev) => [newCust, ...prev]);
    addActivity(
      newCust.id,
      'TRANSACTION',
      selectedLanguage === 'kn'
        ? `ಹೊಸ ಗ್ರಾಹಕರು ${newCust.name} ಖಾತಾವಹಿಯಲ್ಲಿ ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ.`
        : `New customer ${newCust.name} added to khata ledger.`
    );
    showToast(
      selectedLanguage === 'kn'
        ? `${newCust.name} ಅವರನ್ನು ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ಯಶಸ್ವಿಯಾಗಿ ಸೇವ್ ಮಾಡಲಾಗಿದೆ!`
        : `${newCust.name} successfully saved to database!`
    );
  };

  const handleSimulateCreditRequest = () => {
    const ramesh = customers.find((c) => c.id === 'c_ramesh') || customers[0];
    handleTriggerCreditEvaluation(ramesh, 3000);
  };

  const handleResetDemo = () => {
    resetDatabaseToDefault();
    setCustomers(INITIAL_CUSTOMERS);
    setTransactions(INITIAL_TRANSACTIONS);
    setPromises(INITIAL_PROMISES);
    setApprovals(INITIAL_APPROVALS);
    setActivities(INITIAL_ACTIVITIES);
    setSelectedCustomerId(null);
    setActiveTab('dashboard');
    showToast(selectedLanguage === 'kn' ? 'ಡೇಟಾಬೇಸ್ ಮೂಲ ಸ್ಥಿತಿಗೆ ಮರುಹೊಂದಿಸಲಾಗಿದೆ.' : 'Demo state reset to initial shopkeeper ledger.');
  };

  const pendingApprovalsCount = approvals.filter((a) => a.status === 'PENDING').length;

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans antialiased overflow-hidden">
      {/* Desktop Persistent Left Sidebar */}
      <Sidebar
        currentTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'customers') setSelectedCustomerId(null);
        }}
        pendingApprovalsCount={pendingApprovalsCount}
        onOpenAgent={handleOpenAgent}
        selectedLanguage={selectedLanguage}
        onSelectLanguage={setSelectedLanguage}
        totalCustomersCount={customers.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Prototype Demo Controller Bar */}
        <DemoControllerBar
          onSimulateMissedPromise={handleSimulateMissedPromise}
          onSimulatePayment={handleSimulatePayment}
          onSimulateNewPromise={handleSimulateNewPromise}
          onSimulateCreditRequest={handleSimulateCreditRequest}
          onResetDemo={handleResetDemo}
          onOpenAgentWithPhrase={(phrase) => handleOpenAgent('VOICE', phrase)}
          selectedLanguage={selectedLanguage}
        />

        {/* Top Header with Language Selector */}
        <TopHeader
          currentTab={activeTab}
          onOpenAgent={handleOpenAgent}
          selectedLanguage={selectedLanguage}
          onSelectLanguage={setSelectedLanguage}
          totalCustomersCount={customers.length}
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-28 md:pb-12">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardView
                customers={customers}
                transactions={transactions}
                promises={promises}
                approvals={approvals}
                onOpenAgent={handleOpenAgent}
                onNavigateTab={setActiveTab}
                onSelectCustomer={(id) => {
                  setSelectedCustomerId(id);
                  setActiveTab('customers');
                }}
                selectedLanguage={selectedLanguage}
              />
            )}

            {activeTab === 'customers' && (
              <CustomersView
                customers={customers}
                transactions={transactions}
                promises={promises}
                approvals={approvals}
                selectedCustomerId={selectedCustomerId}
                onSelectCustomer={setSelectedCustomerId}
                onOpenAgent={handleOpenAgent}
                onRequestCreditReview={(c, amt) => handleTriggerCreditEvaluation(c, amt)}
                onPrepareReminder={(c) => {
                  const rem: Approval = {
                    id: `app_rem_${Date.now()}`,
                    customer_id: c.id,
                    type: 'REMINDER',
                    reason: selectedLanguage === 'kn' ? `${c.name} ಅವರಿಗೆ ಜ್ಞಾಪನೆ ಸಿದ್ಧಪಡಿಸಲು ಕೋರಲಾಗಿದೆ.` : `Shopkeeper requested reminder for ${c.name}.`,
                    draft_content: selectedLanguage === 'kn'
                      ? `ನಮಸ್ಕಾರ ${c.name} ಅವರೇ, ಶ್ರೀ ಲಕ್ಷ್ಮೀ ಕಿರಾಣಿ ಅಂಗಡಿಯಿಂದ ಸೌಮ್ಯ ಸಂದೇಶ. ನಿಮ್ಮ ಬಾಕಿ ಮೊತ್ತವನ್ನು ಅನುಕೂಲವಾದಾಗ ದಯವಿಟ್ಟು ಪಾವತಿಸಿ.`
                      : `Hi ${c.name}, gentle check-in from Sri Lakshmi Kirana regarding your pending store balance. Please settle when convenient.`,
                    status: 'PENDING',
                    created_at: new Date().toISOString(),
                  };
                  setApprovals((prev) => [rem, ...prev]);
                  setActiveTab('approvals');
                  showToast(selectedLanguage === 'kn' ? `${c.name} ಅವರಿಗೆ ಜ್ಞಾಪನೆ ಸಿದ್ಧವಾಗಿದೆ!` : `Reminder prepared for ${c.name}`);
                }}
                onAddNewCustomerDirect={handleAddNewCustomerDirect}
                selectedLanguage={selectedLanguage}
              />
            )}

            {activeTab === 'promises' && (
              <PromisesView
                customers={customers}
                promises={promises}
                transactions={transactions}
                onOpenAgent={handleOpenAgent}
                onNavigateTab={setActiveTab}
                onSelectCustomer={(id) => {
                  setSelectedCustomerId(id);
                  setActiveTab('customers');
                }}
                selectedLanguage={selectedLanguage}
              />
            )}

            {activeTab === 'approvals' && (
              <ApprovalsView
                approvals={approvals}
                customers={customers}
                onApproveReminder={handleApproveReminder}
                onEditReminderDraft={handleEditReminderDraft}
                onSkipReminder={handleSkipReminder}
                onApproveCredit={handleApproveCredit}
                onDenyCredit={handleDenyCredit}
                selectedLanguage={selectedLanguage}
              />
            )}

            {activeTab === 'activity' && (
              <ActivityView
                activities={activities}
                customers={customers}
                onSelectCustomer={(id) => {
                  setSelectedCustomerId(id);
                  setActiveTab('customers');
                }}
                selectedLanguage={selectedLanguage}
              />
            )}
          </div>
        </main>
      </div>

      {/* Floating Agent Action Button */}
      <div className="fixed bottom-16 md:bottom-6 right-6 z-40">
        <button
          onClick={() => handleOpenAgent('VOICE')}
          className="bg-slate-900 hover:bg-slate-800 text-white pl-4 pr-5 py-3 rounded-full shadow-2xl flex items-center gap-2.5 border border-slate-700/80 hover:scale-105 active:scale-95 transition-all group"
        >
          <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
            <Mic size={16} />
          </div>
          <div className="text-left">
            <span className="text-xs font-extrabold tracking-tight block text-white leading-none">
              {t.talkToMitra}
            </span>
            <span className="text-[10px] text-amber-300 font-medium block">
              {selectedLanguage === 'kn' ? 'ಧ್ವನಿ ಮತ್ತು ಟೈಪಿಂಗ್ ಸಹಾಯಕಿ' : 'Voice & Text Agent'}
            </span>
          </div>
        </button>
      </div>

      {/* Mobile Responsive Bottom Navigation */}
      <MobileNav
        currentTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'customers') setSelectedCustomerId(null);
        }}
        pendingApprovalsCount={pendingApprovalsCount}
        selectedLanguage={selectedLanguage}
      />

      {/* Interactive Multi-turn Conversational Agent Modal */}
      <VoiceTextAgentModal
        isOpen={isAgentOpen}
        onClose={() => setIsAgentOpen(false)}
        customers={customers}
        transactions={transactions}
        promises={promises}
        approvals={approvals}
        onConfirmIntent={handleConfirmIntent}
        initialMode={agentInitialMode}
        prefilledPrompt={agentPrefilledPrompt}
        selectedLanguage={selectedLanguage}
        onSelectLanguage={setSelectedLanguage}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-14 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-800 flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-top duration-200">
          <Sparkles size={16} className="text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
