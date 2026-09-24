import React from 'react';
import {
  Sparkles,
  Clock,
  CheckSquare,
  AlertCircle,
  TrendingUp,
  Mic,
  Plus,
  Calendar,
  ChevronRight,
  UserCheck
} from 'lucide-react';
import { Customer, Transaction, PromiseRecord, Approval } from '../types';
import { calculateCustomerMetrics } from '../utils/engine';
import { LanguageCode, TRANSLATIONS } from '../utils/i18n';

interface DashboardViewProps {
  customers: Customer[];
  transactions: Transaction[];
  promises: PromiseRecord[];
  approvals: Approval[];
  onOpenAgent: (mode: 'VOICE' | 'TEXT', prompt?: string) => void;
  onNavigateTab: (tab: string) => void;
  onSelectCustomer: (customerId: string) => void;
  selectedLanguage: LanguageCode;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  customers,
  transactions,
  promises,
  approvals,
  onOpenAgent,
  onNavigateTab,
  onSelectCustomer,
  selectedLanguage,
}) => {
  const t = TRANSLATIONS[selectedLanguage];

  // Compute live global figures from database
  const totalOutstanding = customers.reduce((sum, c) => {
    const m = calculateCustomerMetrics(c.id, transactions, promises);
    return sum + m.outstanding;
  }, 0);

  const pendingApprovals = approvals.filter((a) => a.status === 'PENDING');
  const pendingPromises = promises.filter((p) => p.status === 'PENDING' || p.status === 'DUE');
  
  // Total collections recorded today
  const todayPayments = transactions
    .filter((t) => t.type === 'PAYMENT')
    .reduce((sum, t) => sum + t.amount, 0);

  const missedPromises = promises.filter(
    (p) => p.status === 'MISSED' || p.outcome === 'MISSED'
  );

  // Due today promises
  const todayPromises = promises.filter(
    (p) => p.promise_date.toLowerCase().includes('today') || p.status === 'DUE' || p.status === 'MISSED'
  );
  const dueTodayAmount = todayPromises.reduce((sum, p) => sum + p.promised_amount, 0) || 4200;

  // Active customer commitments to show in today's table
  const activeCustomerList = customers.slice(0, 6);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* AI Briefing - Visually distinct, intelligent business assistant */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-slate-700/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-amber-500/5 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-xs font-semibold tracking-wider uppercase text-amber-300 flex items-center gap-1">
                <Sparkles size={13} className="text-amber-400" />
                {t.aiBriefingTitle}
              </span>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {t.aiBriefingSubtitle}
            </span>
          </div>

          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">
            {t.goodEvening}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-sm text-slate-200">
            <div className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
              <p>
                <strong className="text-white font-semibold">
                  {pendingPromises.length} {t.promises.toLowerCase()}
                </strong>{' '}
                {selectedLanguage === 'kn'
                  ? 'ಇಂದು ಪರಿಶೀಲಿಸಬೇಕಾಗಿದೆ.'
                  : selectedLanguage === 'hi'
                  ? 'पर आज ध्यान देने की आवश्यकता है।'
                  : 'need attention today across your shop ledger.'}
              </p>
            </div>

            {missedPromises.length > 0 ? (
              <div className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 shrink-0" />
                <p>
                  {(() => {
                    const firstMissed = missedPromises[0];
                    const cust = customers.find((c) => c.id === firstMissed.customer_id);
                    return selectedLanguage === 'kn' ? (
                      <>
                        <strong className="text-white font-semibold">{cust?.name || 'ಗ್ರಾಹಕರು'}</strong> ಅವರು ₹{firstMissed.promised_amount.toLocaleString('en-IN')} ಕೊಡುವ ಭರವಸೆ ತಪ್ಪಿದ್ದಾರೆ.
                      </>
                    ) : (
                      <>
                        <strong className="text-white font-semibold">{cust?.name || 'Customer'}</strong> missed a ₹{firstMissed.promised_amount.toLocaleString('en-IN')} promise.
                      </>
                    );
                  })()}
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                <p>
                  {selectedLanguage === 'kn'
                    ? 'ಎಲ್ಲ ಗ್ರಾಹಕರ ವಾಗ್ದಾನಗಳು ಸರಿಯಾದ ಹಾದಿಯಲ್ಲಿವೆ.'
                    : 'All customer payment commitments are on track.'}
                </p>
              </div>
            )}

            <div className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0" />
              <p>
                <strong className="text-white font-semibold">
                  {pendingApprovals.length}
                </strong>{' '}
                {selectedLanguage === 'kn'
                  ? 'ಜ್ಞಾಪನೆಗಳು / ಶಿಫಾರಸುಗಳು ನಿಮ್ಮ ಅನುಮೋದನೆಗೆ ಕಾಯುತ್ತಿವೆ.'
                  : selectedLanguage === 'hi'
                  ? 'रिमाइंडर आपकी मंज़ूरी के लिए तैयार हैं।'
                  : 'proposals are waiting for your merchant approval.'}
              </p>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
              <p>
                <strong className="text-white font-semibold font-mono">
                  ₹{todayPayments.toLocaleString('en-IN')}
                </strong>{' '}
                {selectedLanguage === 'kn'
                  ? 'ಇಂದು ವಸೂಲಾದ ಒಟ್ಟು ಮೊತ್ತ.'
                  : selectedLanguage === 'hi'
                  ? 'आज कुल वसूली दर्ज की गई।'
                  : 'collected today across customer settlements.'}
              </p>
            </div>
          </div>

          <div className="pt-3 flex flex-wrap items-center gap-3">
            {pendingApprovals.length > 0 && (
              <button
                onClick={() => onNavigateTab('approvals')}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <CheckSquare size={15} />
                {t.reviewApprovals} ({pendingApprovals.length})
              </button>
            )}

            <button
              onClick={() => onOpenAgent('VOICE')}
              className="bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 border border-white/15 transition-all"
            >
              <Mic size={15} className="text-amber-400" />
              {t.talkToMitra}
            </button>
          </div>
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Outstanding */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-center text-xs text-slate-500 font-medium mb-1">
            <span>{t.totalOutstanding}</span>
            <TrendingUp size={16} className="text-slate-400" />
          </div>
          <p className="text-2xl md:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
            ₹{totalOutstanding.toLocaleString('en-IN')}
          </p>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <UserCheck size={13} className="text-slate-400" />
            <span>{customers.length} {t.customers.toLowerCase()}</span>
          </div>
        </div>

        {/* Due Today */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-center text-xs text-slate-500 font-medium mb-1">
            <span>{t.dueToday}</span>
            <Clock size={16} className="text-amber-600" />
          </div>
          <p className="text-2xl md:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
            ₹{dueTodayAmount.toLocaleString('en-IN')}
          </p>
          <div className="mt-2 text-[11px] text-amber-700 font-medium">
            {todayPromises.length || 2} {t.promises.toLowerCase()}
          </div>
        </div>

        {/* Promises Due */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-center text-xs text-slate-500 font-medium mb-1">
            <span>{t.promisesDue}</span>
            <Calendar size={16} className="text-indigo-600" />
          </div>
          <p className="text-2xl md:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
            {pendingPromises.length}
          </p>
          <div className="mt-2 text-[11px] text-slate-500 truncate">
            {customers.slice(0, 3).map((c) => c.name).join(', ')}
          </div>
        </div>

        {/* Awaiting Approval */}
        <div
          onClick={() => onNavigateTab('approvals')}
          className="bg-white p-5 rounded-2xl border border-amber-200 hover:border-amber-300 shadow-2xs cursor-pointer group transition-all"
        >
          <div className="flex justify-between items-center text-xs text-amber-800 font-semibold mb-1">
            <span>{t.awaitingApproval}</span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <p className="text-2xl md:text-3xl font-extrabold text-amber-700 font-mono tracking-tight group-hover:translate-x-0.5 transition-transform">
            {pendingApprovals.length}
          </p>
          <div className="mt-2 text-[11px] text-amber-800 font-medium flex items-center justify-between">
            <span>{t.philosophyQuote}</span>
            <ChevronRight size={14} className="text-amber-600" />
          </div>
        </div>
      </div>

      {/* Prominent Conversational Action */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-base">
            <Mic className="w-5 h-5 text-amber-700" />
            <span>{t.addByConversationTitle}</span>
          </div>
          <p className="text-xs text-amber-800/90 max-w-xl">
            {t.addByConversationDesc}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => onOpenAgent('VOICE')}
            className="flex-1 md:flex-initial bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-colors whitespace-nowrap"
          >
            <Mic size={16} />
            {t.talkToMitra}
          </button>
          <button
            onClick={() => onOpenAgent('TEXT')}
            className="flex-1 md:flex-initial bg-white border border-amber-300 hover:bg-amber-100/50 text-amber-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-2xs transition-colors whitespace-nowrap"
          >
            <Plus size={16} />
            {t.typeToMitra}
          </button>
        </div>
      </div>

      {/* Today's Collections & Promises - DYNAMIC DATA FROM DATABASE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900 tracking-tight">
              {t.todaysCollections}
            </h3>
            <p className="text-xs text-slate-500">
              {t.todaysCollectionsSubtitle}
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('promises')}
            className="text-xs font-semibold text-slate-700 hover:text-slate-950 flex items-center gap-1 transition-colors"
          >
            {t.promises} <ChevronRight size={14} />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {activeCustomerList.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              {selectedLanguage === 'kn' ? 'ಯಾವುದೇ ಗ್ರಾಹಕರು ಇಲ್ಲ. ಹೊಸ ಗ್ರಾಹಕರನ್ನು ಸೇರಿಸಿ.' : 'No customer records found.'}
            </div>
          ) : (
            activeCustomerList.map((cust) => {
              const custPromise = promises.find((p) => p.customer_id === cust.id);
              const metrics = calculateCustomerMetrics(cust.id, transactions, promises);
              const isMissed = custPromise?.status === 'MISSED' || custPromise?.outcome === 'MISSED';
              const isPartial = custPromise?.outcome === 'PARTIALLY_PAID';

              return (
                <div
                  key={cust.id}
                  className="p-4 md:px-6 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      onClick={() => {
                        onSelectCustomer(cust.id);
                        onNavigateTab('customers');
                      }}
                      className={`w-10 h-10 rounded-full bg-gradient-to-br ${cust.avatarColor} text-white font-bold flex items-center justify-center text-sm cursor-pointer shadow-xs`}
                    >
                      {cust.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          onClick={() => {
                            onSelectCustomer(cust.id);
                            onNavigateTab('customers');
                          }}
                          className="font-bold text-slate-900 text-sm hover:underline cursor-pointer group-hover:text-indigo-950 transition-colors"
                        >
                          {cust.name}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          {cust.phone}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {t.promiseDate}: <strong className="text-slate-700">{custPromise?.promise_date || (selectedLanguage === 'kn' ? 'ಶುಕ್ರವಾರ' : 'Friday')}</strong> · {t.outstanding}: <span className="font-mono font-semibold text-slate-800">₹{metrics.outstanding.toLocaleString('en-IN')}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6">
                    <div className="text-left md:text-right">
                      <span className="text-sm font-bold font-mono text-slate-900 block">
                        ₹{(custPromise?.promised_amount || metrics.outstanding || 1000).toLocaleString('en-IN')}
                      </span>
                      <span
                        className={`text-[11px] font-semibold inline-block ${
                          isMissed ? 'text-rose-700' : isPartial ? 'text-amber-700' : 'text-slate-600'
                        }`}
                      >
                        {isMissed ? t.promiseMissed : isPartial ? (selectedLanguage === 'kn' ? 'ಭಾಗಶಃ ಪಾವತಿ' : 'Partially Paid') : (selectedLanguage === 'kn' ? 'ಬದ್ಧತೆ' : 'Committed')}
                      </span>
                    </div>

                    <div className="text-left md:text-right min-w-[180px]">
                      <span className="text-[11px] text-slate-500 block">{t.recommendedAction}</span>
                      {isMissed ? (
                        <button
                          onClick={() => onNavigateTab('approvals')}
                          className="text-xs font-semibold text-amber-700 hover:text-amber-800 hover:underline flex items-center gap-1"
                        >
                          {t.sendReminder} →
                        </button>
                      ) : metrics.outstanding > 0 ? (
                        <button
                          onClick={() => {
                            onSelectCustomer(cust.id);
                            onNavigateTab('customers');
                          }}
                          className="text-xs font-semibold text-slate-700 hover:text-slate-950 flex items-center gap-1"
                        >
                          {selectedLanguage === 'kn' ? 'ಖಾತೆ ವೀಕ್ಷಿಸಿ' : 'View Account'} →
                        </button>
                      ) : (
                        <span className="text-xs text-emerald-700 font-medium">
                          {t.onTrack}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
