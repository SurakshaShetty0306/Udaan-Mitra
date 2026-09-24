import React, { useState } from 'react';
import {
  Clock,
  AlertCircle,
  CheckCircle2,
  Plus,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Customer, PromiseRecord, Transaction } from '../types';
import { LanguageCode, TRANSLATIONS } from '../utils/i18n';

interface PromisesViewProps {
  customers: Customer[];
  promises: PromiseRecord[];
  transactions: Transaction[];
  onOpenAgent: (mode: 'VOICE' | 'TEXT', prompt?: string) => void;
  onNavigateTab: (tab: string) => void;
  onSelectCustomer: (customerId: string) => void;
  selectedLanguage: LanguageCode;
}

export const PromisesView: React.FC<PromisesViewProps> = ({
  customers,
  promises,
  transactions,
  onOpenAgent,
  onNavigateTab,
  onSelectCustomer,
  selectedLanguage,
}) => {
  const t = TRANSLATIONS[selectedLanguage];
  const [filterOutcome, setFilterOutcome] = useState<'ALL' | 'PENDING' | 'MISSED' | 'PARTIALLY_PAID' | 'KEPT_ON_TIME'>('ALL');

  const filteredPromises = promises.filter((p) => {
    if (filterOutcome === 'ALL') return true;
    if (filterOutcome === 'PENDING') return p.status === 'PENDING' || p.status === 'DUE';
    if (filterOutcome === 'MISSED') return p.status === 'MISSED' || p.outcome === 'MISSED';
    return p.outcome === filterOutcome;
  });

  const getOutcomeLabel = (outcome: string, status: string) => {
    if (outcome === 'PARTIALLY_PAID') return selectedLanguage === 'kn' ? 'ಭಾಗಶಃ ಪಾವತಿ' : 'Partially Paid';
    if (outcome === 'KEPT_ON_TIME') return selectedLanguage === 'kn' ? 'ಸಮಯಕ್ಕೆ ಪಾವತಿ' : 'Kept On Time';
    if (outcome === 'PAID_LATE') return selectedLanguage === 'kn' ? 'ತಡವಾಗಿ ಪಾವತಿ' : 'Paid Late';
    if (outcome === 'MISSED' || status === 'MISSED') return t.promiseMissed;
    return selectedLanguage === 'kn' ? 'ಬಾಕಿ ಇದೆ' : 'Pending';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            {t.promises}
          </h2>
          <p className="text-xs text-slate-500">
            {selectedLanguage === 'kn' ? 'ಗ್ರಾಹಕರ ಬದ್ಧತೆಗಳನ್ನು ಮತ್ತು ವಾಸ್ತವಿಕ ಪಾವತಿಯನ್ನು ನಿಖರವಾಗಿ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ' : 'Tracking customer commitments against actual payment outcomes'}
          </p>
        </div>

        <button
          onClick={() => onOpenAgent('VOICE')}
          className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors self-start sm:self-auto"
        >
          <Plus size={16} />
          + {selectedLanguage === 'kn' ? 'ಹೊಸ ಭರವಸೆ ದಾಖಲಿಸಿ' : 'Record New Commitment'}
        </button>
      </div>

      {/* Core Insight Callout */}
      <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-4.5 flex items-start gap-3.5">
        <div className="p-2 rounded-xl bg-indigo-600 text-white shrink-0">
          <Sparkles size={18} />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-950">
            {selectedLanguage === 'kn' ? 'ಗ್ರಾಹಕರ ಬದ್ಧತೆ ತತ್ವ (Commitment Principle)' : 'Customer Commitment Principle'}
          </h4>
          <p className="text-xs text-indigo-900 leading-relaxed">
            {selectedLanguage === 'kn'
              ? 'ಅಂಗಡಿ ವ್ಯಾಪಾರದಲ್ಲಿ, "ಭರವಸೆ" ಎಂಬುದು ಕೇವಲ ದಿನಾಂಕವಲ್ಲ, ಇದು ನಂಬಿಕೆಯ ಬದ್ಧತೆ. ಉಧಾರ್ ಮಿತ್ರ ಪ್ರತಿ ಭರವಸೆಯನ್ನು (ಸಮಯಕ್ಕೆ, ತಡವಾಗಿ, ಭಾಗಶಃ ಅಥವಾ ತಪ್ಪಿದ್ದು) ದಾಖಲಿಸಿ ಗ್ರಾಹಕರ ನೈಜ ಇತಿಹಾಸವನ್ನು ಸಿದ್ಧಪಡಿಸುತ್ತದೆ.'
              : 'In informal retail, a promise is a personal trust commitment made by a customer at the counter, not merely a calendar due date. Udhaar Mitra connects each promise with the actual payment outcome to build an explainable history.'}
          </p>
        </div>
      </div>

      {/* Outcome Category Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'ALL', label: selectedLanguage === 'kn' ? 'ಎಲ್ಲ ಭರವಸೆಗಳು' : 'All Commitments' },
          { id: 'PENDING', label: selectedLanguage === 'kn' ? 'ಬಾಕಿ / ಬರಬೇಕಾದ್ದು' : 'Due / Pending' },
          { id: 'MISSED', label: t.promiseMissed },
          { id: 'PARTIALLY_PAID', label: selectedLanguage === 'kn' ? 'ಭಾಗಶಃ ಪಾವತಿ' : 'Partially Paid' },
          { id: 'KEPT_ON_TIME', label: selectedLanguage === 'kn' ? 'ಸಮಯಕ್ಕೆ ಪಾವತಿಸಿದ್ದು' : 'Kept on Time' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterOutcome(f.id as any)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              filterOutcome === f.id
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Promises List */}
      <div className="space-y-4">
        {filteredPromises.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-2xs space-y-2">
            <Clock size={44} className="mx-auto text-slate-300" />
            <h3 className="text-base font-bold text-slate-900">{t.noUpcomingPromises}</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {selectedLanguage === 'kn' ? 'ಗ್ರಾಹಕರು ಪಾವತಿ ಭರವಸೆ ನೀಡಿದಾಗ ಇಲ್ಲಿ ಕಾಣಿಸಿಕೊಳ್ಳುತ್ತವೆ.' : 'Payment commitments will appear here when customers promise a payment date in conversation.'}
            </p>
          </div>
        ) : (
          filteredPromises.map((p) => {
            const customer = customers.find((c) => c.id === p.customer_id);
            const isMissed = p.status === 'MISSED' || p.outcome === 'MISSED';
            const isPartial = p.outcome === 'PARTIALLY_PAID';
            const isFulfilled = p.status === 'FULFILLED' || p.outcome === 'KEPT_ON_TIME';

            return (
              <div
                key={p.id}
                className={`bg-white p-5 rounded-2xl border shadow-2xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isMissed
                    ? 'border-rose-200 bg-rose-50/10'
                    : isPartial
                    ? 'border-amber-200 bg-amber-50/10'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-base shrink-0 ${
                      isMissed
                        ? 'bg-rose-100 text-rose-700'
                        : isPartial
                        ? 'bg-amber-100 text-amber-700'
                        : isFulfilled
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {isMissed ? (
                      <AlertCircle size={22} />
                    ) : isFulfilled ? (
                      <CheckCircle2 size={22} />
                    ) : (
                      <Clock size={22} />
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        onClick={() => customer && onSelectCustomer(customer.id)}
                        className="font-bold text-base text-slate-900 hover:underline cursor-pointer"
                      >
                        {customer?.name}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {customer?.phone}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">
                      {selectedLanguage === 'kn' ? 'ಭರವಸೆ ಮೊತ್ತ:' : 'Promised Amount:'} <strong className="font-mono text-slate-900">₹{p.promised_amount.toLocaleString('en-IN')}</strong> · {t.promiseDate}: <strong className="text-slate-800">{p.promise_date}</strong>
                    </p>

                    {p.notes && (
                      <p className="text-xs text-slate-500 italic">
                        “{p.notes}”
                      </p>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase">{selectedLanguage === 'kn' ? 'ಫಲಿತಾಂಶ:' : 'Outcome:'}</span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                          isMissed
                            ? 'bg-rose-100 text-rose-800'
                            : isPartial
                            ? 'bg-amber-100 text-amber-800'
                            : isFulfilled
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {getOutcomeLabel(p.outcome, p.status)}
                      </span>

                      {p.delay_days ? (
                        <span className="text-xs text-slate-500 font-mono">
                          ({p.delay_days} {t.days} {selectedLanguage === 'kn' ? 'ತಡ' : 'late'})
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:items-end justify-between gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                  <span className="text-xs text-slate-400 font-medium">{t.recommendedAction}</span>
                  {isMissed ? (
                    <button
                      onClick={() => onNavigateTab('approvals')}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs px-3.5 py-1.5 rounded-xl shadow-2xs transition-colors flex items-center gap-1"
                    >
                      <span>{selectedLanguage === 'kn' ? 'ಜ್ಞಾಪನೆ ಸಂದೇಶ ಪರಿಶೀಲಿಸಿ' : 'Review Gentle Reminder'}</span>
                      <ChevronRight size={14} />
                    </button>
                  ) : isPartial ? (
                    <button
                      onClick={() => onOpenAgent('VOICE', `${customer?.name} said he'll pay Monday`)}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-3.5 py-1.5 rounded-xl shadow-2xs transition-colors flex items-center gap-1"
                    >
                      <span>{selectedLanguage === 'kn' ? 'ಹೊಸ ದಿನಾಂಕ ದಾಖಲಿಸಿ' : 'Log New Commitment Date'}</span>
                      <ChevronRight size={14} />
                    </button>
                  ) : (
                    <span className="text-xs text-slate-600">
                      {selectedLanguage === 'kn' ? 'ಮುಂದಿನ ಪಾವತಿಗಾಗಿ ಕಾಯಲಾಗುತ್ತಿದೆ' : 'Monitoring next settlement'}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
