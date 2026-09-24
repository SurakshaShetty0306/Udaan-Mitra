import React, { useState } from 'react';
import {
  Search,
  ChevronRight,
  ArrowLeft,
  Clock,
  Activity,
  Sparkles,
  Phone,
  Plus,
  ShieldCheck,
  MessageSquare,
  CreditCard,
  UserPlus,
  X
} from 'lucide-react';
import { Customer, Transaction, PromiseRecord, Approval } from '../types';
import { calculateCustomerMetrics } from '../utils/engine';
import { LanguageCode, TRANSLATIONS } from '../utils/i18n';

interface CustomersViewProps {
  customers: Customer[];
  transactions: Transaction[];
  promises: PromiseRecord[];
  approvals: Approval[];
  selectedCustomerId: string | null;
  onSelectCustomer: (id: string | null) => void;
  onOpenAgent: (mode: 'VOICE' | 'TEXT', prompt?: string) => void;
  onRequestCreditReview: (customer: Customer, amount: number) => void;
  onPrepareReminder: (customer: Customer) => void;
  onAddNewCustomerDirect: (name: string, phone: string, notes: string) => void;
  selectedLanguage: LanguageCode;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  transactions,
  promises,
  approvals,
  selectedCustomerId,
  onSelectCustomer,
  onOpenAgent,
  onRequestCreditReview,
  onPrepareReminder,
  onAddNewCustomerDirect,
  selectedLanguage,
}) => {
  const t = TRANSLATIONS[selectedLanguage];
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'AMBER' | 'GREEN' | 'RED'>('ALL');
  const [creditAmountInput, setCreditAmountInput] = useState<number>(3000);
  const [showCreditModal, setShowCreditModal] = useState(false);

  // New Customer Modal
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustNotes, setNewCustNotes] = useState('');

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);

    if (!matchesSearch) return false;

    if (filterStatus === 'ALL') return true;
    const metrics = calculateCustomerMetrics(c.id, transactions, promises);
    return metrics.statusLevel === filterStatus;
  });

  const handleCreateCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;
    onAddNewCustomerDirect(newCustName.trim(), newCustPhone.trim(), newCustNotes.trim());
    setNewCustName('');
    setNewCustPhone('');
    setNewCustNotes('');
    setShowAddCustomerModal(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {!selectedCustomer ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
                {t.customers}
              </h2>
              <p className="text-xs text-slate-500">
                {selectedLanguage === 'kn'
                  ? 'ಗ್ರಾಹಕರ ವಿವರವಾದ ಖಾತಾವಹಿ ಮತ್ತು ನೈಜ ಪಾವತಿ ಇತಿಹಾಸ'
                  : 'Searchable accounts with explainable payment behavior & promise outcomes'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddCustomerModal(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <UserPlus size={15} />
                <span>{t.addNewCustomer}</span>
              </button>

              <button
                onClick={() => onOpenAgent('VOICE')}
                className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-3.5 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
              >
                <Plus size={15} />
                <span>{selectedLanguage === 'kn' ? 'ಮಾತಿನ ಮೂಲಕ ಸೇರಿಸಿ' : 'Add via Agent'}</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            {/* Search Bar & Filter Controls */}
            <div className="p-4 border-b border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl">
                {(['ALL', 'GREEN', 'AMBER', 'RED'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setFilterStatus(lvl)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      filterStatus === lvl
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {lvl === 'ALL' ? t.all : lvl === 'GREEN' ? t.green : lvl === 'AMBER' ? t.amber : t.red}
                  </button>
                ))}
              </div>
            </div>

            {/* Customer Table */}
            <div className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-sm">
                  {selectedLanguage === 'kn'
                    ? `“${searchQuery}” ಹೆಸರಿನ ಯಾವುದೇ ಗ್ರಾಹಕರು ಕಂಡುಬಂದಿಲ್ಲ.`
                    : `No customers found matching “${searchQuery}”.`}
                </div>
              ) : (
                filteredCustomers.map((c) => {
                  const metrics = calculateCustomerMetrics(c.id, transactions, promises);
                  const custPromises = promises.filter((p) => p.customer_id === c.id);
                  const activePromise = custPromises.find((p) => p.status === 'PENDING' || p.status === 'DUE' || p.status === 'MISSED');

                  return (
                    <div
                      key={c.id}
                      onClick={() => onSelectCustomer(c.id)}
                      className="p-4 md:px-6 hover:bg-slate-50 transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 rounded-full bg-gradient-to-br ${c.avatarColor} text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0`}
                        >
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-base group-hover:text-indigo-950 transition-colors">
                              {c.name}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">
                              {c.phone}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {c.notes || (selectedLanguage === 'kn' ? 'ಖಾತೆ ಗ್ರಾಹಕರು' : 'Khata account holder')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-6 md:gap-8">
                        {/* Outstanding */}
                        <div className="text-left md:text-right">
                          <span className="text-xs text-slate-500 block">{t.outstanding}</span>
                          <span className="font-mono text-base font-bold text-slate-900">
                            ₹{metrics.outstanding.toLocaleString('en-IN')}
                          </span>
                        </div>

                        {/* Next Promise */}
                        <div className="text-left md:text-right min-w-[100px]">
                          <span className="text-xs text-slate-500 block">{t.nextPromise}</span>
                          <span className="text-xs font-semibold text-slate-800">
                            {activePromise ? activePromise.promise_date : (selectedLanguage === 'kn' ? 'ಯಾವುದೂ ಇಲ್ಲ' : 'None pending')}
                          </span>
                        </div>

                        {/* Status */}
                        <div className="text-left md:text-right min-w-[130px]">
                          <span className="text-xs text-slate-500 block">{t.status}</span>
                          <div className="flex items-center gap-1.5 md:justify-end">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                metrics.statusLevel === 'GREEN'
                                  ? 'bg-emerald-500'
                                  : metrics.statusLevel === 'AMBER'
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                            />
                            <span
                              className={`text-xs font-bold ${
                                metrics.statusLevel === 'GREEN'
                                  ? 'text-emerald-700'
                                  : metrics.statusLevel === 'AMBER'
                                  ? 'text-amber-700'
                                  : 'text-rose-700'
                              }`}
                            >
                              {metrics.statusLevel === 'GREEN'
                                ? `🟢 ${t.green}`
                                : metrics.statusLevel === 'AMBER'
                                ? `🟠 ${t.amber}`
                                : `🔴 ${t.red}`}{' '}
                              · {metrics.statusLevel === 'GREEN' ? t.onTrack : metrics.statusLevel === 'AMBER' ? t.reviewNeeded : t.highRisk}
                            </span>
                          </div>
                        </div>

                        <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        /* CUSTOMER DETAIL VIEW - 100% DYNAMIC & LOCALIZED */
        <div className="space-y-6">
          <button
            onClick={() => onSelectCustomer(null)}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft size={16} />
            {t.backToCustomers}
          </button>

          {/* Customer Header */}
          {(() => {
            const metrics = calculateCustomerMetrics(selectedCustomer.id, transactions, promises);
            const custTransactions = transactions.filter((t) => t.customer_id === selectedCustomer.id);
            const custPromises = promises.filter((p) => p.customer_id === selectedCustomer.id);

            return (
              <>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${selectedCustomer.avatarColor} text-white font-extrabold flex items-center justify-center text-xl shadow-xs`}
                    >
                      {selectedCustomer.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                          {selectedCustomer.name}
                        </h2>
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            metrics.statusLevel === 'GREEN'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : metrics.statusLevel === 'AMBER'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {metrics.statusLevel === 'AMBER' ? `🟠 ${t.reviewNeeded}` : metrics.statusLevel === 'GREEN' ? `🟢 ${t.onTrack}` : `🔴 ${t.highRisk}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Phone size={13} /> {selectedCustomer.phone}
                        </span>
                        <span>·</span>
                        <span>{selectedLanguage === 'kn' ? 'ಖಾತೆ ಆರಂಭ:' : 'Since'} {selectedCustomer.createdAt}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-left md:text-right border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                    <span className="text-xs text-slate-500 block">{t.currentOutstanding}</span>
                    <span className="text-3xl font-extrabold font-mono text-slate-900 tracking-tight">
                      ₹{metrics.outstanding.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      {t.totalCreditLabel}: ₹{metrics.totalCredit.toLocaleString('en-IN')} · {t.repaidLabel}: ₹{metrics.totalPayments.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Evidence & AI Observation */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Payment Behavior Box */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                        <Activity size={18} className="text-slate-600" />
                        <span>{t.paymentBehaviorEvidence}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {t.calculatedFromLedger}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 font-medium">{t.promisesMade}</span>
                        <span className="font-mono font-bold text-slate-900">{metrics.promisesMade}</span>
                      </div>

                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 font-medium">{t.keptOnTime}</span>
                        <span className="font-mono font-bold text-emerald-600">{metrics.keptOnTime}</span>
                      </div>

                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 font-medium">{t.missedLate}</span>
                        <span className="font-mono font-bold text-rose-600">{metrics.missedLate}</span>
                      </div>

                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 font-medium">{t.partialPayments}</span>
                        <span className="font-mono font-bold text-amber-600">{metrics.partialPayments}</span>
                      </div>

                      <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-100">
                        <span className="text-slate-600 font-medium">{t.averageDelayDays}</span>
                        <span className="font-mono font-bold text-slate-900">{metrics.averageDelayDays} {t.days}</span>
                      </div>
                    </div>
                  </div>

                  {/* Why This Matters / AI Observation */}
                  <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-3 text-amber-400">
                        <Sparkles size={18} />
                        <h3 className="font-bold text-sm tracking-tight text-white">
                          {t.whyThisMatters}
                        </h3>
                      </div>

                      <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          {t.patternLabel}
                        </p>
                        <p className="text-sm text-slate-200 leading-relaxed">
                          {selectedLanguage === 'kn' ? (
                            <>
                              {selectedCustomer.name} ಅವರು <strong className="text-amber-300 font-semibold">{metrics.promisesMade} ಭರವಸೆಗಳಲ್ಲಿ {metrics.keptOnTime} ಸಮಯಕ್ಕೆ ಪಾವತಿಸಿದ್ದಾರೆ</strong>,{' '}
                              <strong className="text-amber-300 font-semibold">{metrics.missedLate} ತಪ್ಪಿದೆ/ತಡವಾಗಿದೆ</strong>.{' '}
                              ಪ್ರಸ್ತುತ <strong className="text-white font-semibold">₹{metrics.outstanding.toLocaleString('en-IN')}</strong> ಬಾಕಿ ಉಳಿದಿದೆ.
                            </>
                          ) : (
                            <>
                              {selectedCustomer.name} has made <strong className="text-amber-300 font-semibold">{metrics.promisesMade} commitments</strong>, kept{' '}
                              <strong className="text-emerald-300 font-semibold">{metrics.keptOnTime} on time</strong>, and{' '}
                              <strong className="text-amber-300 font-semibold">{metrics.missedLate} missed or late</strong>.{' '}
                              <strong className="text-white font-semibold">₹{metrics.outstanding.toLocaleString('en-IN')}</strong> currently outstanding.
                            </>
                          )}
                        </p>
                      </div>

                      <div className="mt-4 space-y-1">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          {t.recommendedNextStep}
                        </p>
                        <p className="text-sm font-medium text-amber-200 italic">
                          “{metrics.outstanding > 0
                            ? (selectedLanguage === 'kn' ? 'ಹೆಚ್ಚುವರಿ ಸಾಲ ನೀಡುವ ಮುನ್ನ ಹಳೆಯ ಬಾಕಿಯನ್ನು ಭಾಗಶಃ ವಸೂಲಿ ಮಾಡಲು ಸೂಚಿಸಲಾಗಿದೆ.' : 'Consider collecting part of the outstanding amount before extending additional credit.')
                            : (selectedLanguage === 'kn' ? 'ಗ್ರಾಹಕರ ಟ್ರ್ಯಾಕ್ ರೆಕಾರ್ಡ್ ಉತ್ತಮವಾಗಿದೆ. ಸಾಲ ನೀಡಬಹುದು.' : 'Customer is in good standing. Safe to extend requested credit.')}”
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex flex-wrap gap-2">
                      <button
                        onClick={() => setShowCreditModal(true)}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <ShieldCheck size={15} />
                        {t.reviewCreditRequest}
                      </button>

                      {metrics.outstanding > 0 && (
                        <button
                          onClick={() => onPrepareReminder(selectedCustomer)}
                          className="bg-white/10 hover:bg-white/20 text-white font-semibold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 border border-white/15 transition-colors"
                        >
                          <MessageSquare size={15} />
                          {t.prepareReminder}
                        </button>
                      )}

                      <button
                        onClick={() => onOpenAgent('VOICE', `${selectedCustomer.name} took 500 groceries and will pay Friday`)}
                        className="bg-white/10 hover:bg-white/20 text-white font-semibold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 border border-white/15 transition-colors"
                      >
                        <CreditCard size={15} />
                        {selectedLanguage === 'kn' ? 'ಹೊಸ ಸಾಲ/ಪಾವತಿ ದಾಖಲಿಸಿ' : 'Record Transaction'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* DYNAMIC Payment & Promise Timeline From Real Records */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                      <Clock size={18} className="text-slate-600" />
                      <span>{t.commitmentTimeline}</span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {t.timelineSubtitle}
                    </span>
                  </div>

                  {custTransactions.length === 0 && custPromises.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 text-xs">
                      {selectedLanguage === 'kn'
                        ? 'ಈ ಗ್ರಾಹಕರಿಗೆ ಇನ್ನೂ ಯಾವುದೇ ವಹಿವಾಟು ದಾಖಲಾಗಿಲ್ಲ. “ಹೊಸ ಸಾಲ/ಪಾವತಿ ದಾಖಲಿಸಿ” ಒತ್ತಿ.'
                        : 'No transactions or promises recorded yet for this customer.'}
                    </div>
                  ) : (
                    <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                      {/* Interleaved transactions & promises */}
                      {custTransactions.map((tx) => (
                        <div key={tx.id} className="relative group">
                          <div
                            className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full ring-4 ring-white ${
                              tx.type === 'CREDIT' ? 'bg-slate-900' : 'bg-emerald-500'
                            }`}
                          />
                          <div
                            className={`p-3.5 rounded-xl space-y-1 border ${
                              tx.type === 'CREDIT'
                                ? 'bg-slate-50 border-slate-200/80'
                                : 'bg-emerald-50/70 border-emerald-200'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-slate-500 font-mono">
                                {tx.transaction_date}
                              </span>
                              <span
                                className={`text-xs font-bold font-mono ${
                                  tx.type === 'CREDIT' ? 'text-slate-900' : 'text-emerald-800'
                                }`}
                              >
                                {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}{' '}
                                {tx.type === 'CREDIT' ? t.creditAmount : t.paymentAmount}
                              </span>
                            </div>
                            <p className="text-xs text-slate-700">{tx.note}</p>
                          </div>
                        </div>
                      ))}

                      {custPromises.map((pr) => (
                        <div key={pr.id} className="relative group">
                          <div
                            className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full ring-4 ring-white ${
                              pr.status === 'MISSED'
                                ? 'bg-rose-500'
                                : pr.outcome === 'PARTIALLY_PAID'
                                ? 'bg-amber-500'
                                : 'bg-indigo-600'
                            }`}
                          />
                          <div
                            className={`p-3.5 rounded-xl space-y-1 border ${
                              pr.status === 'MISSED'
                                ? 'bg-rose-50/70 border-rose-200'
                                : pr.outcome === 'PARTIALLY_PAID'
                                ? 'bg-amber-50/70 border-amber-200'
                                : 'bg-indigo-50/70 border-indigo-200'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-slate-500 font-mono">
                                {t.promiseDate}: {pr.promise_date}
                              </span>
                              <span className="text-xs font-bold font-mono text-slate-900">
                                ₹{pr.promised_amount.toLocaleString('en-IN')}
                              </span>
                            </div>
                            <p className="text-xs text-slate-700">{pr.notes || 'Payment commitment'}</p>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md inline-block mt-1 ${
                                pr.status === 'MISSED'
                                  ? 'bg-rose-100 text-rose-800'
                                  : pr.outcome === 'PARTIALLY_PAID'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-indigo-100 text-indigo-800'
                              }`}
                            >
                              {pr.status === 'MISSED' ? t.promiseMissed : pr.outcome === 'PARTIALLY_PAID' ? 'Partially Paid' : pr.status}
                            </span>
                          </div>
                        </div>
                      ))}

                      <div className="relative group">
                        <div className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-slate-400 ring-4 ring-white" />
                        <div className="bg-slate-100 border border-slate-300 p-3.5 rounded-xl flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700">{t.currentBalanceStatus}</span>
                          <span className="text-sm font-extrabold text-slate-900 font-mono">
                            ₹{metrics.outstanding.toLocaleString('en-IN')} {t.stillOutstanding}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Credit Modal */}
                {showCreditModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
                      <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldCheck size={18} className="text-amber-400" />
                          <h3 className="font-bold text-sm text-white">
                            {selectedLanguage === 'kn'
                              ? `${selectedCustomer.name} ಅವರಿಗೆ ಸಾಲ ಮಂಜೂರಾತಿ ಪರಿಶೀಲನೆ`
                              : `Test Credit Extension Request for ${selectedCustomer.name}`}
                          </h3>
                        </div>
                        <button onClick={() => setShowCreditModal(false)} className="text-slate-400 hover:text-white">
                          ✕
                        </button>
                      </div>

                      <div className="p-6 space-y-4">
                        <p className="text-xs text-slate-600">
                          {selectedLanguage === 'kn'
                            ? 'ಗ್ರಾಹಕರು ಕೇಳಿದ ಸಾಲದ ಮೊತ್ತವನ್ನು ನಮೂದಿಸಿ (ಉದಾ: ₹3,000). AI ಹಳೆಯ ಡೇಟಾವನ್ನು ಪರಿಶೀಲಿಸಿ ನಿಮಗೆ ಶಿಫಾರಸು ನೀಡುತ್ತದೆ.'
                            : 'Simulate customer requesting additional credit. The AI will evaluate against stored evidence and propose an approval card for you to decide.'}
                        </p>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                            {t.creditAmount} (₹)
                          </label>
                          <input
                            type="number"
                            step="500"
                            value={creditAmountInput}
                            onChange={(e) => setCreditAmountInput(Number(e.target.value))}
                            className="w-full text-base font-bold font-mono border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-slate-900"
                          />
                        </div>

                        <div className="flex gap-2">
                          {[1000, 2000, 3000, 5000].map((amt) => (
                            <button
                              key={amt}
                              onClick={() => setCreditAmountInput(amt)}
                              className="px-3 py-1 text-xs font-mono bg-slate-100 hover:bg-amber-100 rounded-lg text-slate-800"
                            >
                              ₹{amt}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
                        <button
                          onClick={() => setShowCreditModal(false)}
                          className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
                        >
                          {t.cancel}
                        </button>
                        <button
                          onClick={() => {
                            onRequestCreditReview(selectedCustomer, creditAmountInput);
                            setShowCreditModal(false);
                          }}
                          className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex items-center gap-1.5"
                        >
                          <Sparkles size={14} className="text-amber-400" />
                          {t.reviewCreditRequest}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* DIRECT ADD CUSTOMER MODAL */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-slate-950 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus size={18} className="text-amber-400" />
                <h3 className="font-bold text-sm text-white">
                  {t.addNewCustomer}
                </h3>
              </div>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCustomerSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  {t.customerNameLabel} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={selectedLanguage === 'kn' ? 'ಉದಾ: ಪ್ರಿಯಾ ಶೆಟ್ಟಿ ಅಥವಾ ಮಹೇಶ್' : 'e.g. Priya Shetty or Mahesh'}
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  {t.phoneNumberLabel}
                </label>
                <input
                  type="tel"
                  placeholder="+91 98451 12345"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  {t.notesLabel}
                </label>
                <input
                  type="text"
                  placeholder={selectedLanguage === 'kn' ? 'ಉದಾ: ದೇವಸ್ಥಾನದ ರಸ್ತೆ, ನಿಯಮಿತ ಗ್ರಾಹಕರು' : 'e.g. Temple road, regular customer'}
                  value={newCustNotes}
                  onChange={(e) => setNewCustNotes(e.target.value)}
                  className="w-full text-sm border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
                >
                  {t.saveCustomer}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
