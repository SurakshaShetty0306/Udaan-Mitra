import React from 'react';
import {
  Activity,
  Sparkles,
  Send,
  CreditCard,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { ActivityLogItem, Customer } from '../types';
import { LanguageCode, TRANSLATIONS } from '../utils/i18n';

interface ActivityViewProps {
  activities: ActivityLogItem[];
  customers: Customer[];
  onSelectCustomer: (id: string) => void;
  selectedLanguage: LanguageCode;
}

export const ActivityView: React.FC<ActivityViewProps> = ({
  activities,
  customers,
  onSelectCustomer,
  selectedLanguage,
}) => {
  const t = TRANSLATIONS[selectedLanguage];

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            {t.auditTitle}
          </h2>
          <p className="text-xs text-slate-500">
            {t.auditSubtitle}
          </p>
        </div>

        <span className="text-xs font-mono text-slate-500 bg-white px-3 py-1 rounded-xl border border-slate-200">
          {activities.length} {t.eventsRecorded}
        </span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6">
        <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {activities.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              {selectedLanguage === 'kn' ? 'ಯಾವುದೇ ಇತ್ತೀಚಿನ ಚಟುವಟಿಕೆ ಇಲ್ಲ.' : 'No recent activity recorded yet.'}
            </div>
          ) : (
            activities.map((act) => {
              const customer = customers.find((c) => c.id === act.customer_id);

              let badgeIcon = <Activity size={14} />;
              let badgeColor = 'bg-slate-100 text-slate-700';

              if (act.event_type === 'TRANSACTION') {
                badgeIcon = <CreditCard size={14} />;
                badgeColor = 'bg-emerald-100 text-emerald-800';
              } else if (act.event_type === 'PROMISE') {
                badgeIcon = <Clock size={14} />;
                badgeColor = 'bg-indigo-100 text-indigo-800';
              } else if (act.event_type === 'APPROVAL' || act.event_type === 'REMINDER') {
                badgeIcon = <Send size={14} />;
                badgeColor = 'bg-amber-100 text-amber-800';
              } else if (act.event_type === 'RECOMMENDATION') {
                badgeIcon = <Sparkles size={14} />;
                badgeColor = 'bg-purple-100 text-purple-800';
              }

              return (
                <div key={act.id} className="relative group">
                  <div className="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full bg-slate-900 ring-4 ring-white" />
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1 ${badgeColor}`}>
                        {badgeIcon}
                        {act.event_type}
                      </span>
                      {customer && (
                        <button
                          onClick={() => onSelectCustomer(customer.id)}
                          className="text-xs font-bold text-slate-800 hover:text-indigo-900 hover:underline flex items-center gap-0.5"
                        >
                          {customer.name}
                          <ArrowUpRight size={12} className="text-slate-400" />
                        </button>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      {act.formatted_time}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed mt-1">
                    {act.description}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
