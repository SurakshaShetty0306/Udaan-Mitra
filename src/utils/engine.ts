import { Customer, Transaction, PromiseRecord, ParsedAgentIntent, RecommendationLevel, Approval } from '../types';
import { LanguageCode } from './i18n';

export interface CustomerMetrics {
  totalCredit: number;
  totalPayments: number;
  outstanding: number;
  promisesMade: number;
  keptOnTime: number;
  missedLate: number;
  partialPayments: number;
  averageDelayDays: number;
  fulfillmentRate: number;
  latestPromise?: PromiseRecord;
  statusLevel: RecommendationLevel;
  statusLabel: string;
}

export function calculateCustomerMetrics(
  customerId: string,
  transactions: Transaction[],
  promises: PromiseRecord[]
): CustomerMetrics {
  const custTx = transactions.filter((t) => t.customer_id === customerId);
  const custPromises = promises.filter((p) => p.customer_id === customerId);

  const totalCredit = custTx
    .filter((t) => t.type === 'CREDIT')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPayments = custTx
    .filter((t) => t.type === 'PAYMENT')
    .reduce((sum, t) => sum + t.amount, 0);

  const outstanding = Math.max(0, totalCredit - totalPayments);

  const promisesMade = custPromises.length;
  const keptOnTime = custPromises.filter((p) => p.outcome === 'KEPT_ON_TIME').length;
  const missedLate = custPromises.filter(
    (p) => p.outcome === 'MISSED' || p.outcome === 'PAID_LATE' || p.status === 'MISSED'
  ).length;

  const partialPayments = custPromises.filter(
    (p) => p.outcome === 'PARTIALLY_PAID'
  ).length;

  const delays = custPromises
    .map((p) => p.delay_days || 0)
    .filter((d) => d > 0);
  
  const averageDelayDays = delays.length > 0 
    ? Math.round(delays.reduce((a, b) => a + b, 0) / delays.length)
    : (missedLate > 0 ? 4 : 0);

  const completedPromises = custPromises.filter((p) => p.status === 'FULFILLED' || p.status === 'MISSED').length;
  const fulfillmentRate = completedPromises > 0 
    ? Math.round((keptOnTime / completedPromises) * 100) 
    : (promisesMade === 0 ? 100 : 80);

  let statusLevel: RecommendationLevel = 'GREEN';
  let statusLabel = 'On Track';

  if (missedLate >= 2 || (outstanding > 1000 && missedLate >= 1) || partialPayments > 0) {
    statusLevel = 'AMBER';
    statusLabel = 'Review Needed';
  } else if (missedLate > 3 || (outstanding > 3500 && missedLate >= 2)) {
    statusLevel = 'RED';
    statusLabel = 'Attention Needed';
  } else if (outstanding === 0) {
    statusLevel = 'GREEN';
    statusLabel = 'Cleared';
  }

  const sortedPromises = [...custPromises].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return {
    totalCredit,
    totalPayments,
    outstanding,
    promisesMade,
    keptOnTime,
    missedLate,
    partialPayments,
    averageDelayDays,
    fulfillmentRate,
    latestPromise: sortedPromises[0],
    statusLevel,
    statusLabel,
  };
}

export interface CreditEvaluationResult {
  level: RecommendationLevel;
  badgeLabel: string;
  reasons: string[];
  suggestedAction: string;
  recommendedMaxCredit: number;
}

export function evaluateCreditRecommendation(
  customer: Customer,
  requestedAmount: number,
  metrics: CustomerMetrics
): CreditEvaluationResult {
  const reasons: string[] = [];

  if (metrics.outstanding > 0) {
    reasons.push(`₹${metrics.outstanding.toLocaleString('en-IN')} remains outstanding`);
  }
  if (metrics.missedLate > 0) {
    reasons.push(`${metrics.missedLate} recent promises were missed or late`);
  }
  if (metrics.partialPayments > 0) {
    reasons.push('Recent payment was partial');
  }
  if (metrics.averageDelayDays > 0) {
    reasons.push(`Average payment delay is ${metrics.averageDelayDays} days`);
  }

  if (reasons.length === 0) {
    reasons.push(`Zero current outstanding balance`);
    reasons.push(`Clean repayment track record`);
  }

  let level: RecommendationLevel = 'GREEN';
  let badgeLabel = '🟢 GREEN — Approved to extend';
  let suggestedAction = `Safe to extend full credit of ₹${requestedAmount.toLocaleString('en-IN')}.`;
  let recommendedMaxCredit = requestedAmount;

  if (metrics.missedLate >= 2 || metrics.outstanding > 0 || metrics.partialPayments > 0) {
    level = 'AMBER';
    badgeLabel = '🟠 AMBER — Review before extending full credit';
    suggestedAction = `Consider collecting part of the existing balance (₹${metrics.outstanding.toLocaleString('en-IN')}) before extending full ₹${requestedAmount.toLocaleString('en-IN')}.`;
    recommendedMaxCredit = Math.max(1000, requestedAmount - metrics.outstanding);
  }

  return {
    level,
    badgeLabel,
    reasons,
    suggestedAction,
    recommendedMaxCredit,
  };
}

export function normalizeNumerals(str: string): string {
  const devanagariDigits = ['०','१','२','३','४','५','೬','७','८','९'];
  const kannadaDigits = ['೦','೧','೨','೩','೪','೫','೬','೭','೮','೯'];

  let res = str;
  devanagariDigits.forEach((d, i) => {
    res = res.replaceAll(d, i.toString());
  });
  kannadaDigits.forEach((d, i) => {
    res = res.replaceAll(d, i.toString());
  });
  return res;
}

// Stop words that should NEVER be recognized as customer names
const STOP_WORDS = new Set([
  'who', 'what', 'when', 'where', 'how', 'why', 'can', 'will', 'did', 'is', 'are', 'was',
  'give', 'credit', 'payment', 'paid', 'took', 'owes', 'balance', 'udhaar', 'khata', 'today',
  'tomorrow', 'yesterday', 'friday', 'monday', 'tuesday', 'wednesday', 'thursday', 'saturday', 'sunday',
  'yes', 'no', 'save', 'confirm', 'cancel', 'edit', 'groceries', 'shop', 'kirana', 'provisions',
  'rs', 'inr', 'rupees', 'amount', 'total', 'please', 'hello', 'hi', 'hey', 'namaste', 'namaskara',
  'ಯಾರು', 'ಏನು', 'ಎಷ್ಟು', 'ಯಾವಾಗ', 'ಹೇಗೆ', 'ಸಾಲ', 'ಪಾವತಿ', 'ಹಣ', 'ಖಾತೆ', 'ಇಂದು', 'ನಾಳೆ', 'ನಿನ್ನೆ',
  'ಶುಕ್ರವಾರ', 'ಸೋಮವಾರ', 'ಮಂಗಳವಾರ', 'ಬುಧವಾರ', 'ಗುರುವಾರ', 'ಶನಿವಾರ', 'ಭಾನುವಾರ', 'ಹೌದು', 'ಬೇಡ', 'ಸರಿ',
  'ಉಳಿಸಿ', 'ದಿನಸಿ', 'ಸಾಮಾನು', 'ಅಂಗಡಿ', 'ಬಾಕಿ', 'ನಮಸ್ಕಾರ', 'ಕೊಡಿ', 'ಕೊಟ್ಟರು', 'ತಗೊಂಡರು'
]);

// Dynamically and reliably extracts ANY customer name from speech/text input without defaulting to Ramesh!
export function extractCustomerNameFromInput(
  text: string,
  existingCustomers: Customer[]
): { name: string; isExisting: boolean; customer?: Customer } {
  const clean = text.trim();
  const lower = clean.toLowerCase();

  // 1. Check if any existing customer is explicitly mentioned (exact or partial word match)
  for (const c of existingCustomers) {
    const custLower = c.name.toLowerCase();
    const regex = new RegExp(`\\b${custLower}\\b`, 'i');
    if (regex.test(clean) || lower.includes(custLower)) {
      return { name: c.name, isExisting: true, customer: c };
    }
  }

  // 2. Kannada Name Patterns:
  // e.g. "ರಾಜು ₹500 ತಗೊಂಡಿದ್ದಾರೆ", "ಸುರೇಶ್ ಗೆ ಸಾಲ", "ಮಂಜುನಾಥ್ ಕೊಟ್ಟಿದ್ದಾರೆ", "ಆನಂದ್ ಖಾತೆ", "ಪ್ರಿಯಾ ₹1,000"
  const knMatch = clean.match(/([\u0C80-\u0CFF]{2,15})(?:\s+ಅವರಿಗೆ|\s+ಅವರು|\s+ಗೆ|\s+ಅವರ|\s+ನೇ|\s+ಅವರಿಂದ)?\s*(?:₹|[0-9೦-೯]+|ಸಾಲ|ರೂಪಾಯಿ|ಸಾಮಾನು|ಕೊಟ್ಟಿದ್ದಾರೆ|ತಗೊಂಡಿದ್ದಾರೆ|ಕೊಡ್ತಾರೆ|ಪಾವತಿ|ಬಾಕಿ|ಖಾತೆ)/);
  if (knMatch && knMatch[1]) {
    const candidate = knMatch[1].trim();
    if (!STOP_WORDS.has(candidate.toLowerCase()) && candidate.length >= 2) {
      return { name: candidate, isExisting: false };
    }
  }

  // Kannada start of sentence name: e.g. "ರಾಜು 500"
  const knStartMatch = clean.match(/^([\u0C80-\u0CFF]{2,15})\s+/);
  if (knStartMatch && knStartMatch[1]) {
    const candidate = knStartMatch[1].trim();
    if (!STOP_WORDS.has(candidate.toLowerCase()) && candidate.length >= 2) {
      return { name: candidate, isExisting: false };
    }
  }

  // 3. English Name Patterns:
  // e.g. "Give 500 to Suresh", "Credit 1000 for Deepak", "Add Chethan 2000", "Priya took 500"
  const enPatterns = [
    /(?:to|for|from|of|give|credit|add)\s+([A-Za-z]{2,15})/i,
    /^([A-Za-z]{2,15})\s+(?:took|paid|gave|has|said|promised|will|wants|owes|needs)/i,
    /^([A-Za-z]{2,15})\s+(?:₹|rs\.?|[0-9]+)/i,
    /([A-Za-z]{2,15})'s?\s+(?:balance|account|khata|udhaar)/i,
  ];

  for (const pat of enPatterns) {
    const m = clean.match(pat);
    if (m && m[1]) {
      const candidate = m[1].trim();
      const candLower = candidate.toLowerCase();
      if (!STOP_WORDS.has(candLower) && candidate.length >= 2) {
        const formatted = candidate.charAt(0).toUpperCase() + candidate.slice(1);
        return { name: formatted, isExisting: false };
      }
    }
  }

  // 4. Hindi Name Patterns: e.g. "सुनील ने", "राकेश को"
  const hiMatch = clean.match(/([\u0900-\u097F]{2,15})\s+(?:ने|को|का|से)/);
  if (hiMatch && hiMatch[1]) {
    const candidate = hiMatch[1].trim();
    if (!STOP_WORDS.has(candidate.toLowerCase())) {
      return { name: candidate, isExisting: false };
    }
  }

  // 5. Look for capitalized words that are not common English words
  const words = clean.split(/\s+/);
  for (const w of words) {
    const stripped = w.replace(/[^A-Za-z\u0C80-\u0CFF\u0900-\u097F]/g, '');
    const strippedLower = stripped.toLowerCase();
    if (stripped.length >= 2 && !STOP_WORDS.has(strippedLower)) {
      if (/^[A-Z][a-z]{1,14}$/.test(stripped)) {
        return { name: stripped, isExisting: false };
      }
    }
  }

  // If no name found, return empty name - DO NOT DEFAULT TO RAMESH!
  return { name: '', isExisting: false };
}

export function parseShopkeeperSpeechOrText(
  rawInput: string,
  customers: Customer[]
): ParsedAgentIntent | null {
  const text = normalizeNumerals(rawInput.trim());
  const lower = text.toLowerCase();

  // Extract customer name dynamically
  const extracted = extractCustomerNameFromInput(rawInput, customers);
  const matchedCustomer = extracted.customer || (extracted.name ? {
    id: `c_${extracted.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`,
    name: extracted.name,
    phone: '+91 98451 ' + Math.floor(10000 + Math.random() * 90000),
    avatarColor: 'from-amber-600 to-amber-700',
    createdAt: new Date().toISOString().split('T')[0],
  } : null);

  // Extract amount
  const amountMatch = text.match(/(?:₹\s*|rs\.?\s*|inr\s*|ರೂ\s*|రూ\s*|रू\s*)?([0-9]+(?:,[0-9]+)*)/i);
  let amount: number | undefined;
  if (amountMatch && amountMatch[1]) {
    const val = parseInt(amountMatch[1].replace(/,/g, ''), 10);
    if (!isNaN(val) && val > 0) {
      amount = val;
    }
  }

  // Day detection
  let detectedDay = 'Friday';
  if (lower.includes('friday') || lower.includes('शुक्रवार') || lower.includes('ಶುಕ್ರವಾರ') || lower.includes('ಶುಕ್ರ')) {
    detectedDay = 'Friday';
  } else if (lower.includes('monday') || lower.includes('सोमवार') || lower.includes('ಸೋಮವಾರ') || lower.includes('ಸೋಮ')) {
    detectedDay = 'Monday';
  } else if (lower.includes('tomorrow') || lower.includes('कल') || lower.includes('ನಾಳೆ')) {
    detectedDay = 'Tomorrow';
  } else if (lower.includes('sunday') || lower.includes('रविवार') || lower.includes('ಭಾನುವಾರ')) {
    detectedDay = 'Sunday';
  } else if (lower.includes('saturday') || lower.includes('शनिवार') || lower.includes('ಶನಿವಾರ')) {
    detectedDay = 'Saturday';
  } else if (lower.includes('wednesday') || lower.includes('ಬುಧವಾರ')) {
    detectedDay = 'Wednesday';
  } else if (lower.includes('thursday') || lower.includes('ಗುರುವಾರ')) {
    detectedDay = 'Thursday';
  }

  const custName = matchedCustomer?.name || '';
  const custId = matchedCustomer?.id || '';

  // Intent 1: Credit Request Evaluation
  if (
    lower.includes('review credit') ||
    lower.includes('credit review') ||
    lower.includes('can i give') ||
    lower.includes('evaluate credit') ||
    lower.includes('समीक्षा') ||
    lower.includes('ಸಾಲ ಪರಿಶೀಲಿಸಿ') ||
    lower.includes('ಸಾಲ ಕೊಡಬಹುದಾ')
  ) {
    return {
      raw_input: rawInput,
      intent_type: 'CREDIT_REQUEST',
      customer_id: custId,
      customer_name: custName,
      amount: amount || 3000,
      explanation: `Credit evaluation for ₹${(amount || 3000).toLocaleString('en-IN')} requested for ${custName || 'customer'}`,
      confidence: 0.95,
    };
  }

  // Intent 2: Record Payment Received
  if (
    lower.includes('paid') ||
    lower.includes('gave') ||
    lower.includes('collected') ||
    lower.includes('received') ||
    lower.includes('settled') ||
    lower.includes('payment') ||
    lower.includes('जमा') ||
    lower.includes('दिए') ||
    lower.includes('ಕೊಟ್ಟಿದ್ದಾರೆ') ||
    lower.includes('ಕೊಟ್ಟರು') ||
    lower.includes('ಪಾವತಿ') ||
    lower.includes('ಪಾವತಿಸಿದ್ದಾರೆ')
  ) {
    return {
      raw_input: rawInput,
      intent_type: 'RECORD_PAYMENT',
      customer_id: custId,
      customer_name: custName,
      amount: amount || 1000,
      explanation: `Payment of ₹${(amount || 1000).toLocaleString('en-IN')} recorded from ${custName || 'customer'}`,
      confidence: 0.96,
    };
  }

  // Intent 3: New Promise Only
  if (
    (lower.includes("pay monday") ||
     lower.includes("pay friday") ||
     lower.includes("pay tomorrow") ||
     lower.includes("will pay") ||
     lower.includes('ಕೊಡ್ತಾರೆ') ||
     lower.includes('ಕೊಡ್ತೀನಿ') ||
     lower.includes('ಕೊಡುತ್ತೇನೆ') ||
     lower.includes('सोमवार को देगा')) &&
    !lower.includes('took') &&
    !lower.includes('ಸಾಮಾನು') &&
    !lower.includes('groceries') &&
    !lower.includes('ಸಾಲ')
  ) {
    return {
      raw_input: rawInput,
      intent_type: 'NEW_PROMISE_ONLY',
      customer_id: custId,
      customer_name: custName,
      amount: amount || 1000,
      promise_date: detectedDay,
      explanation: `New payment commitment for ${detectedDay} from ${custName || 'customer'}`,
      confidence: 0.92,
    };
  }

  // Intent 4: New Credit + Promise Commitment
  if (
    lower.includes('took') ||
    lower.includes('udhaar') ||
    lower.includes('groceries') ||
    lower.includes('ಸಾಮಾನು') ||
    lower.includes('ತಗೊಂಡಿದ್ದಾರೆ') ||
    lower.includes('ಸಾಲ') ||
    lower.includes('सामान लिया') ||
    lower.includes('credit') ||
    (amount && (lower.includes('pay') || lower.includes('ಕೊಡ್ತಾರೆ') || lower.includes('friday') || lower.includes('monday') || lower.includes('ನಾಳೆ')))
  ) {
    return {
      raw_input: rawInput,
      intent_type: 'NEW_CREDIT_PROMISE',
      customer_id: custId,
      customer_name: custName,
      amount: amount || 2000,
      promise_date: detectedDay,
      item_note: 'Daily kirana provisions',
      explanation: `₹${(amount || 2000).toLocaleString('en-IN')} credit for ${custName || 'customer'}, payment promised ${detectedDay}`,
      confidence: 0.98,
    };
  }

  return {
    raw_input: rawInput,
    intent_type: 'GENERAL_QUERY',
    customer_id: custId,
    customer_name: custName,
    amount: amount,
    explanation: `Query concerning ${custName || 'shop khata'}`,
    confidence: 0.7,
  };
}

// Conversational Interactive AI Engine that answers ANY question from the shopkeeper
export interface ConversationalAgentReply {
  text: string;
  speechText: string;
  hasActionProposal: boolean;
  proposedIntent?: ParsedAgentIntent;
}

export function processConversationalQuery(
  userInput: string,
  lang: LanguageCode,
  customers: Customer[],
  transactions: Transaction[],
  promises: PromiseRecord[],
  approvals: Approval[],
  pendingIntent?: ParsedAgentIntent | null
): ConversationalAgentReply {
  const clean = userInput.trim().toLowerCase();

  // 1. Handle user replying YES / Confirming previous proposal
  const isAffirmative = clean === 'yes' || clean === 'save' || clean === 'save it' || clean === 'confirm' ||
    clean === 'ಹೌದು' || clean === 'ಸೇವ್ ಮಾಡಿ' || clean === 'ಸರಿ' || clean === 'ಉಳಿಸಿ' || clean === 'ಹಾ' ||
    clean === 'ಖಂಡಿತ' || clean === 'ಮಾಡ್ರಿ' || clean === 'ಮಾಡಿಸಿ' || clean === 'ಆಯಿತು' ||
    clean === 'हाँ' || clean === 'सेव करो' || clean === 'haan' || clean === 'theek hai' || clean === 'save karo';

  if (isAffirmative && pendingIntent) {
    const custName = pendingIntent.customer_name || 'ಗ್ರಾಹಕರು';
    if (lang === 'kn') {
      return {
        text: `✅ ${custName} ಅವರ ಖಾತೆಗೆ ಯಶಸ್ವಿಯಾಗಿ ಸೇವ್ ಮಾಡಲಾಗಿದೆ! ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ತಕ್ಷಣ ದಾಖಲಾಗಿದೆ.`,
        speechText: `${custName} ಅವರ ಖಾತೆಗೆ ಯಶಸ್ವಿಯಾಗಿ ಸೇವ್ ಮಾಡಲಾಗಿದೆ.`,
        hasActionProposal: false,
      };
    } else if (lang === 'hi') {
      return {
        text: `✅ ${custName} के खाते में प्रविष्टि सफलतापूर्वक सेव हो गई है!`,
        speechText: `${custName} के खाते में सेव हो गया है।`,
        hasActionProposal: false,
      };
    } else {
      return {
        text: `✅ Successfully saved to ${custName}'s khata ledger! Database updated in real-time.`,
        speechText: `Successfully saved to ${custName}'s khata.`,
        hasActionProposal: false,
      };
    }
  }

  // 2. Handle user replying NO / Cancel
  const isNegative = clean === 'no' || clean === 'cancel' || clean === 'dont save' ||
    clean === 'ಬೇಡ' || clean === 'ರದ್ದು ಮಾಡಿ' || clean === 'ಇಲ್ಲ' || clean === 'ಬೇಡಪ್ಪ' ||
    clean === 'नहीं' || clean === 'रद्द करो' || clean === 'nahi';

  if (isNegative) {
    if (lang === 'kn') {
      return {
        text: `ಸರಿ, ಈ ಪ್ರಕ್ರಿಯೆಯನ್ನು ರದ್ದು ಮಾಡಲಾಗಿದೆ. ನೀವು ಖಾತೆಯ ಬಗ್ಗೆ ಯಾವುದೇ ಪ್ರಶ್ನೆ ಕೇಳಬಹುದು.`,
        speechText: `ಸರಿ, ರದ್ದು ಮಾಡಲಾಗಿದೆ.`,
        hasActionProposal: false,
      };
    } else {
      return {
        text: `Understood, cancelled. How else can I assist with your shop khata?`,
        speechText: `Understood, cancelled.`,
        hasActionProposal: false,
      };
    }
  }

  // 3. Question: Who owes money? / ಯಾರ್ಯಾರು ಹಣ ಕೊಡಬೇಕು? / کس کس کا باقی ہے؟
  if (
    clean.includes('who owes') || clean.includes('who has balance') || clean.includes('debtor') ||
    clean.includes('total outstanding') || clean.includes('total balance') ||
    clean.includes('ಯಾರ್ಯಾರು ಹಣ') || clean.includes('ಯಾರಿಗೆಲ್ಲ ಬಾಕಿ') || clean.includes('ಯಾರು ಕೊಡಬೇಕು') || clean.includes('ಬಾಕಿದಾರರು') ||
    clean.includes('किस किस का बाकी') || clean.includes('कौन पैसा देगा') || clean.includes('kitna baaki hai')
  ) {
    const debtorList = customers
      .map((c) => ({ customer: c, metrics: calculateCustomerMetrics(c.id, transactions, promises) }))
      .filter((item) => item.metrics.outstanding > 0)
      .sort((a, b) => b.metrics.outstanding - a.metrics.outstanding);

    const total = debtorList.reduce((sum, item) => sum + item.metrics.outstanding, 0);

    if (lang === 'kn') {
      const names = debtorList.map((d) => `• ${d.customer.name}: ₹${d.metrics.outstanding.toLocaleString('en-IN')}`).join('\n');
      return {
        text: `ನಿಮ್ಮ ಅಂಗಡಿಯಲ್ಲಿ ಒಟ್ಟು ₹${total.toLocaleString('en-IN')} ಬಾಕಿ ಇದೆ. ಪ್ರಮುಖ ಬಾಕಿದಾರರು:\n${names}`,
        speechText: `ನಿಮ್ಮ ಅಂಗಡಿಯಲ್ಲಿ ಒಟ್ಟು ${total} ರೂಪಾಯಿ ಬಾಕಿ ಇದೆ. ${debtorList.length} ಗ್ರಾಹಕರು ಬಾಕಿ ಉಳಿಸಿಕೊಂಡಿದ್ದಾರೆ.`,
        hasActionProposal: false,
      };
    } else {
      const names = debtorList.map((d) => `• ${d.customer.name}: ₹${d.metrics.outstanding.toLocaleString('en-IN')}`).join('\n');
      return {
        text: `Total shop outstanding is ₹${total.toLocaleString('en-IN')}. Outstanding customers:\n${names}`,
        speechText: `Total outstanding is ₹${total.toLocaleString('en-IN')} across ${debtorList.length} accounts.`,
        hasActionProposal: false,
      };
    }
  }

  // 4. Question: Specific customer inquiry: e.g. "Suresh balance", "ಸುರೇಶ್ ಎಷ್ಟು ಕೊಡಬೇಕು?", "ರಮೇಶ್ ಬಾಕಿ ಎಷ್ಟು?"
  for (const c of customers) {
    if (clean.includes(c.name.toLowerCase())) {
      const m = calculateCustomerMetrics(c.id, transactions, promises);
      const activePromise = promises.find((p) => p.customer_id === c.id && (p.status === 'PENDING' || p.status === 'DUE' || p.status === 'MISSED'));

      // Check if it's an action statement like "Suresh took 500" or "Suresh paid 200"
      const hasActionWord = clean.includes('took') || clean.includes('paid') || clean.includes('give') || clean.includes('credit') ||
        clean.includes('ತಗೊಂಡಿದ್ದಾರೆ') || clean.includes('ಕೊಟ್ಟಿದ್ದಾರೆ') || clean.includes('ಸಾಲ') || clean.includes('दिए') || clean.includes('लिया');

      if (!hasActionWord) {
        if (lang === 'kn') {
          return {
            text: `${c.name} ಅವರ ಪ್ರಸ್ತುತ ಬಾಕಿ ₹${m.outstanding.toLocaleString('en-IN')} ಆಗಿದೆ. ಅವರ ಒಟ್ಟು ಸಾಲ ₹${m.totalCredit.toLocaleString('en-IN')} ಮತ್ತು ಪಾವತಿಸಿದ್ದು ₹${m.totalPayments.toLocaleString('en-IN')}. ಸ್ಥಿತಿ: ${m.statusLabel}. ${activePromise ? `ಮುಂದಿನ ಭರವಸೆ: ${activePromise.promise_date} (₹${activePromise.promised_amount.toLocaleString('en-IN')}).` : 'ಯಾವುದೇ ಮುಂಬರುವ ಭರವಸೆ ಇಲ್ಲ.'}`,
            speechText: `${c.name} ಅವರ ಪ್ರಸ್ತುತ ಬಾಕಿ ${m.outstanding} ರೂಪಾಯಿ ಆಗಿದೆ.`,
            hasActionProposal: false,
          };
        } else {
          return {
            text: `${c.name}'s current balance is ₹${m.outstanding.toLocaleString('en-IN')} (Total Credit: ₹${m.totalCredit.toLocaleString('en-IN')}, Repaid: ₹${m.totalPayments.toLocaleString('en-IN')}). Status: ${m.statusLabel}. ${activePromise ? `Next commitment: ${activePromise.promise_date} (₹${activePromise.promised_amount.toLocaleString('en-IN')}).` : 'No pending promises.'}`,
            speechText: `${c.name} owes ₹${m.outstanding.toLocaleString('en-IN')}.`,
            hasActionProposal: false,
          };
        }
      }
    }
  }

  // 5. Question: Today's promises / collections / ಇಂದಿನ ವಸೂಲಿ
  if (clean.includes('today') || clean.includes('ಇಂದು') || clean.includes('ಇಂದಿನ') || clean.includes('आज') || clean.includes('collection')) {
    const todayP = promises.filter((p) => p.promise_date.toLowerCase().includes('today') || p.status === 'DUE' || p.status === 'MISSED');
    const todayPayments = transactions.filter((t) => t.type === 'PAYMENT').reduce((sum, t) => sum + t.amount, 0);

    if (todayP.length > 0 || todayPayments > 0) {
      const list = todayP.map((p) => {
        const cust = customers.find((c) => c.id === p.customer_id);
        return `• ${cust?.name}: ₹${p.promised_amount.toLocaleString('en-IN')} (${p.status})`;
      }).join('\n');

      if (lang === 'kn') {
        return {
          text: `ಇಂದಿನ ವಸೂಲಿ: ₹${todayPayments.toLocaleString('en-IN')}.\nಇಂದು ಪರಿಶೀಲಿಸಬೇಕಾದ ಭರವಸೆಗಳು:\n${list || 'ಯಾವುದೂ ಇಲ್ಲ'}`,
          speechText: `ಇಂದು ${todayPayments} ರೂಪಾಯಿ ವಸೂಲಿಯಾಗಿದೆ.`,
          hasActionProposal: false,
        };
      } else {
        return {
          text: `Today's collections: ₹${todayPayments.toLocaleString('en-IN')}.\nCommitments needing attention:\n${list || 'None'}`,
          speechText: `Today's collections are ₹${todayPayments.toLocaleString('en-IN')}.`,
          hasActionProposal: false,
        };
      }
    }
  }

  // 6. Question: Who are you / What can you do / Help
  if (
    clean.includes('who are you') || clean.includes('what can you do') || clean.includes('help') ||
    clean.includes('ನೀವು ಯಾರು') || clean.includes('ಏನು ಮಾಡಬಲ್ಲಿರಿ') || clean.includes('ಸಹಾಯ') ||
    clean.includes('ಕನ್ನಡ') || clean.includes('tum kaun ho') || clean.includes('kya kar sakte')
  ) {
    if (lang === 'kn') {
      return {
        text: `ನಾನು **ಉಧಾರ್ ಮಿತ್ರ** — ನಿಮ್ಮ ಅಂಗಡಿಯ ವಿಶ್ವಾಸಾರ್ಹ AI ಸಾಲ ಸಹಾಯಕ!\n\nನೀವು ನನ್ನೊಂದಿಗೆ ಮಾತನಾಡಬಹುದು ಅಥವಾ ಟೈಪ್ ಮಾಡಬಹುದು:\n1. **ಸಾಲ ದಾಖಲಿಸಲು**: "ರಾಜು ₹2,000 ಸಾಮಾನು ತಗೊಂಡಿದ್ದಾರೆ ಶುಕ್ರವಾರ ಕೊಡ್ತಾರೆ"\n2. **ಪಾವತಿ ದಾಖಲಿಸಲು**: "ಸುರೇಶ್ ₹500 ಕೊಟ್ಟಿದ್ದಾರೆ"\n3. **ಬಾಕಿ ತಿಳಿಯಲು**: "ರಮೇಶ್ ಬಾಕಿ ಎಷ್ಟು?" ಅಥವಾ "ಯಾರ್ಯಾರು ಹಣ ಕೊಡಬೇಕು?"\n4. **ಸಾಲ ಪರಿಶೀಲನೆ**: "ರಮೇಶ್‌ಗೆ ₹3,000 ಸಾಲ ಕೊಡಬಹುದಾ?"`,
        speechText: `ನಾನು ಉಧಾರ್ ಮಿತ್ರ — ನಿಮ್ಮ ಅಂಗಡಿಯ AI ಸಾಲ ಸಹಾಯಕ. ಸಾಲ, ಪಾವತಿ ಅಥವಾ ಬಾಕಿ ಬಗ್ಗೆ ಯಾವುದೇ ಪ್ರಶ್ನೆ ಕೇಳಿ.`,
        hasActionProposal: false,
      };
    } else {
      return {
        text: `I am **Udhaar Mitra** — your approval-first AI credit assistant for your kirana store.\n\nYou can speak or type to me:\n1. **Record Credit**: “Raju took ₹2,000 groceries and will pay Friday”\n2. **Record Payment**: “Suresh paid ₹500”\n3. **Check Balances**: “What is Ramesh's balance?” or “Who owes money?”\n4. **Evaluate Credit**: “Can I give ₹3,000 credit to Suresh?”`,
        speechText: `I am Udhaar Mitra, your shop credit assistant. You can record credit, payments, or check any customer balance.`,
        hasActionProposal: false,
      };
    }
  }

  // 7. General Greetings
  if (clean === 'hi' || clean === 'hello' || clean === 'ನಮಸ್ಕಾರ' || clean === 'namaste' || clean === 'ಹಲೋ') {
    if (lang === 'kn') {
      return {
        text: `ನಮಸ್ಕಾರ ಸುರಕ್ಷಾ ಅವರೇ! ನಾನು ನಿಮ್ಮ ಉಧಾರ್ ಮಿತ್ರ. ಯಾವುದೇ ಗ್ರಾಹಕರ ಸಾಲ, ಪಾವತಿ ಅಥವಾ ಬಾಕಿ ಬಗ್ಗೆ ಹೇಳಿ.`,
        speechText: `ನಮಸ್ಕಾರ ಸುರಕ್ಷಾ ಅವರೇ! ನಾನು ನಿಮ್ಮ ಉಧಾರ್ ಮಿತ್ರ.`,
        hasActionProposal: false,
      };
    } else {
      return {
        text: `Hello Suraksha! I am your Udhaar Mitra credit agent. How can I help with your ledger today?`,
        speechText: `Hello Suraksha! How can I help with your ledger today?`,
        hasActionProposal: false,
      };
    }
  }

  // 8. Action Intent parsing (Credit, Payment, Promise)
  const parsed = parseShopkeeperSpeechOrText(userInput, customers);

  if (parsed && parsed.customer_name && parsed.customer_name.trim().length > 0 && parsed.intent_type !== 'GENERAL_QUERY') {
    let confirmText = '';
    let speech = '';

    if (parsed.intent_type === 'RECORD_PAYMENT') {
      if (lang === 'kn') {
        confirmText = `ನನಗೆ ಅರ್ಥವಾಯಿತು:\n• ಗ್ರಾಹಕರು: **${parsed.customer_name}**\n• ಪಾವತಿ ಮೊತ್ತ: **₹${(parsed.amount || 1000).toLocaleString('en-IN')}**\n\nಈ ಪಾವತಿಯನ್ನು ಖಾತೆಯಲ್ಲಿ ಜಮೆ ಮಾಡಬೇಕೆ? (ಹೌದು ಎಂದು ಹೇಳಿ ಅಥವಾ Confirm ಒತ್ತಿರಿ)`;
        speech = `ನನಗೆ ಅರ್ಥವಾಯಿತು: ${parsed.customer_name}, ${parsed.amount || 1000} ರೂಪಾಯಿ ಪಾವತಿ. ಇದನ್ನು ಉಳಿಸಬೇಕೆ?`;
      } else {
        confirmText = `I understood:\n• Customer: **${parsed.customer_name}**\n• Payment Amount: **₹${(parsed.amount || 1000).toLocaleString('en-IN')}**\n\nRecord this payment? (Reply 'Yes' or click Confirm)`;
        speech = `I understood ${parsed.customer_name}, ₹${parsed.amount || 1000} payment. Save this?`;
      }
    } else if (parsed.intent_type === 'NEW_PROMISE_ONLY') {
      if (lang === 'kn') {
        confirmText = `ನನಗೆ ಅರ್ಥವಾಯಿತು:\n• ಗ್ರಾಹಕರು: **${parsed.customer_name}**\n• ಭರವಸೆ ದಿನ: **${parsed.promise_date || 'ಶುಕ್ರವಾರ'}**\n• ಮೊತ್ತ: **₹${(parsed.amount || 1000).toLocaleString('en-IN')}**\n\nಈ ಭರವಸೆಯನ್ನು ಉಳಿಸಬೇಕೆ?`;
        speech = `ನನಗೆ ಅರ್ಥವಾಯಿತು: ${parsed.customer_name}, ${parsed.promise_date || 'ಶುಕ್ರವಾರ'} ಕೊಡುವ ಭರವಸೆ. ಇದನ್ನು ಉಳಿಸಬೇಕೆ?`;
      } else {
        confirmText = `I understood:\n• Customer: **${parsed.customer_name}**\n• Promise Date: **${parsed.promise_date || 'Friday'}**\n• Amount: **₹${(parsed.amount || 1000).toLocaleString('en-IN')}**\n\nSave this commitment?`;
        speech = `I understood ${parsed.customer_name}, promised ${parsed.promise_date || 'Friday'}. Save this?`;
      }
    } else {
      // NEW_CREDIT_PROMISE or CREDIT_REQUEST
      if (lang === 'kn') {
        confirmText = `ನನಗೆ ಅರ್ಥವಾಯಿತು:\n• ಗ್ರಾಹಕರು: **${parsed.customer_name}**\n• ಸಾಲದ ಮೊತ್ತ: **₹${(parsed.amount || 2000).toLocaleString('en-IN')}**\n• ಕೊಡುವ ದಿನ: **${parsed.promise_date || 'ಶುಕ್ರವಾರ'}**\n\nಈ ಪಾವತಿ ಬದ್ಧತೆಯನ್ನು ಖಾತೆಯಲ್ಲಿ ಉಳಿಸಬೇಕೆ? (ಹೌದು ಎಂದು ಹೇಳಿ ಅಥವಾ Confirm ಒತ್ತಿರಿ)`;
        speech = `ನನಗೆ ಅರ್ಥವಾಯಿತು: ${parsed.customer_name}, ${parsed.amount || 2000} ರೂಪಾಯಿ ಸಾಲ. ಇದನ್ನು ಉಳಿಸಬೇಕೆ?`;
      } else {
        confirmText = `I understood:\n• Customer: **${parsed.customer_name}**\n• Credit Amount: **₹${(parsed.amount || 2000).toLocaleString('en-IN')}**\n• Promise Date: **${parsed.promise_date || 'Friday'}**\n\nSave this payment commitment? (Reply 'Yes' or click Confirm)`;
        speech = `I understood ${parsed.customer_name}, ₹${parsed.amount || 2000} credit promised for ${parsed.promise_date || 'Friday'}. Save this?`;
      }
    }

    return {
      text: confirmText,
      speechText: speech,
      hasActionProposal: true,
      proposedIntent: parsed,
    };
  }

  // 9. If amount was mentioned but no customer name found
  if (parsed && parsed.amount && (!parsed.customer_name || parsed.customer_name.trim() === '')) {
    if (lang === 'kn') {
      return {
        text: `₹${parsed.amount.toLocaleString('en-IN')} ಮೊತ್ತ ತಿಳಿಸಿದ್ದೀರಿ. ದಯವಿಟ್ಟು ಯಾವ ಗ್ರಾಹಕರ ಹೆಸರು ಹೇಳಿ? (ಉದಾ: "ರಾಜು ₹${parsed.amount} ತಗೊಂಡಿದ್ದಾರೆ")`,
        speechText: `ಯಾವ ಗ್ರಾಹಕರ ಹೆಸರು? ದಯವಿಟ್ಟು ಗ್ರಾಹಕರ ಹೆಸರನ್ನು ತಿಳಿಸಿ.`,
        hasActionProposal: false,
      };
    } else {
      return {
        text: `I got the amount ₹${parsed.amount.toLocaleString('en-IN')}. Which customer is this for? (e.g. "Raju took ₹${parsed.amount}")`,
        speechText: `Which customer is this for? Please specify the name.`,
        hasActionProposal: false,
      };
    }
  }

  // 10. Intelligent general question answering fallback
  if (lang === 'kn') {
    return {
      text: `ನನಗೆ ನೀವು ಹೇಳಿದ್ದು ತಲುಪಿದೆ: “${userInput}”.\n\nಖಾತೆಯಲ್ಲಿ ಹೊಸ ಸಾಲ ಅಥವಾ ಪಾವತಿ ದಾಖಲಿಸಲು ಗ್ರಾಹಕರ ಹೆಸರು ಮತ್ತು ಮೊತ್ತ ತಿಳಿಸಿ (ಉದಾ: "ರಾಜು ₹500 ಸಾಲ ತಗೊಂಡಿದ್ದಾರೆ" ಅಥವಾ "ಸುರೇಶ್ ₹300 ಕೊಟ್ಟಿದ್ದಾರೆ"). ಬಾಕಿ ತಿಳಿಯಲು "ಯಾರ್ಯಾರು ಹಣ ಕೊಡಬೇಕು?" ಎಂದು ಕೇಳಿ.`,
      speechText: `ನನಗೆ ಅರ್ಥವಾಯಿತು. ನೀವು ಯಾವುದೇ ಗ್ರಾಹಕರ ಸಾಲ, ಪಾವತಿ ಅಥವಾ ಬಾಕಿ ಬಗ್ಗೆ ಕೇಳಬಹುದು.`,
      hasActionProposal: false,
    };
  } else {
    return {
      text: `I heard: “${userInput}”.\n\nTo record a transaction, tell me the customer name and amount (e.g. “Raju took ₹500 groceries” or “Suresh paid ₹300”). To check balances, ask “Who owes money?” or “[Customer] balance”.`,
      speechText: `I heard you. You can record credit, payments, or ask about any customer balance.`,
      hasActionProposal: false,
    };
  }
}
