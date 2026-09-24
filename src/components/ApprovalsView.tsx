import React, { useState } from 'react';
import {
  CheckSquare,
  Sparkles,
  ShieldAlert,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Edit3,
  Send,
  ShieldCheck,
  Check
} from 'lucide-react';
import { Approval, Customer } from '../types';
import { EditReminderModal, ReduceCreditModal } from './ApprovalModals';
import { LanguageCode, TRANSLATIONS } from '../utils/i18n';

interface ApprovalsViewProps {
  approvals: Approval[];
  customers: Customer[];
  onApproveReminder: (approvalId: string) => void;
  onEditReminderDraft: (approvalId: string, updatedDraft: string) => void;
  onSkipReminder: (approvalId: string) => void;
  onApproveCredit: (approvalId: string, amount: number) => void;
  onDenyCredit: (approvalId: string) => void;
  selectedLanguage: LanguageCode;
}

export const ApprovalsView: React.FC<ApprovalsViewProps> = ({
  approvals,
  customers,
  onApproveReminder,
  onEditReminderDraft,
  onSkipReminder,
  onApproveCredit,
  onDenyCredit,
  selectedLanguage,
}) => {
  const t = TRANSLATIONS[selectedLanguage];
  const [editingApproval, setEditingApproval] = useState<Approval | null>(null);
  const [reducingApproval, setReducingApproval] = useState<Approval | null>(null);

  const pendingApprovals = approvals.filter((a) => a.status === 'PENDING');
  const pastDecisions = approvals.filter((a) => a.status !== 'PENDING');

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Principle Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">
            {t.approvals}
          </h2>
          <p className="text-xs text-slate-500">
            {selectedLanguage === 'kn' ? 'ಅಂಗಡಿಯವರ ಒಪ್ಪಿಗೆಯಿಲ್ಲದೆ ಯಾವುದೇ ಬಾಹ್ಯ ಕ್ರಮ ಕೈಗೊಳ್ಳುವುದಿಲ್ಲ' : 'Autonomous agent proposals requiring merchant consent before any action'}
          </p>
        </div>

        <div className="bg-amber-100 text-amber-900 border border-amber-300/80 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto">
          <Sparkles size={14} className="text-amber-700" />
          <span>{t.philosophyQuote}</span>
        </div>
      </div>

      {/* Governance Notice */}
      <div className="bg-slate-900 text-slate-200 rounded-2xl p-4.5 border border-slate-800 text-xs flex items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-white font-semibold flex items-center gap-2">
            <ShieldCheck size={16} className="text-amber-400" />
            {t.governanceNoticeTitle}
          </p>
          <p className="text-slate-400 leading-relaxed">
            {t.governanceNoticeDesc}
          </p>
        </div>
      </div>

      {/* Pending Approvals */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            {t.awaitingDecision} ({pendingApprovals.length})
          </h3>
        </div>

        {pendingApprovals.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-2xs space-y-2">
            <CheckCircle2 size={44} className="mx-auto text-emerald-500" />
            <h3 className="text-base font-bold text-slate-900">{t.youAreAllCaughtUp}</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {selectedLanguage === 'kn' ? 'ಯಾವುದೇ ಕ್ರಮಗಳು ನಿಮ್ಮ ಅನುಮೋದನೆಗೆ ಕಾಯುತ್ತಿಲ್ಲ.' : 'No actions are waiting for your approval. New recommendations will appear here automatically.'}
            </p>
          </div>
        ) : (
          pendingApprovals.map((app) => {
            const customer = customers.find((c) => c.id === app.customer_id);
            const isReminder = app.type === 'REMINDER';
            const isCredit = app.type === 'CREDIT_RECOMMENDATION';
            const isAmber = app.metadata?.level === 'AMBER';
            const reqAmount = app.metadata?.requested_amount || app.metadata?.original_amount || 3000;

            return (
              <div
                key={app.id}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
                  isAmber ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'
                }`}
              >
                <div
                  className={`px-6 py-3.5 border-b flex items-center justify-between ${
                    isAmber ? 'bg-amber-50/70 border-amber-200' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {isReminder ? (
                      <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                        <MessageSquare size={16} />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                        <ShieldAlert size={16} />
                      </div>
                    )}
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {isReminder ? t.reminderReady : t.creditRequestRecommendation}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {t.customer}: <strong className="text-slate-800">{customer?.name}</strong> · {customer?.phone}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                    {t.awaitingApproval}
                  </span>
                </div>

                <div className="p-6 space-y-4">
                  {/* CREDIT RECOMMENDATION CONTENT */}
                  {isCredit && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-200">
                        <span className="w-3.5 h-3.5 rounded-full bg-amber-500 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-amber-900">
                            🟠 {t.amber} — {selectedLanguage === 'kn' ? `ಪೂರ್ಣ ಸಾಲ ನೀಡುವ ಮುನ್ನ ಪರಿಶೀಲಿಸಿ (ಕೋರಿದ್ದು: ₹${reqAmount.toLocaleString('en-IN')})` : `Review before extending full credit (Requested: ₹${reqAmount.toLocaleString('en-IN')})`}
                          </p>
                          <p className="text-[11px] text-amber-800 mt-0.5">
                            {selectedLanguage === 'kn' ? 'ಗ್ರಾಹಕರ ಇತ್ತೀಚಿನ ಪಾವತಿ ಇತಿಹಾಸದಲ್ಲಿ ಅಪಾಯದ ಸಂಕೇತಗಳಿವೆ.' : 'Credit risk signals detected in stored customer payment behavior.'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          {t.evidenceFromHistory}
                        </p>
                        <ul className="text-xs text-slate-700 space-y-1.5 pl-4 list-disc">
                          {selectedLanguage === 'kn' ? (
                            <>
                              <li>₹1,000 ಹಳೆಯ ಬಾಕಿ ಉಳಿದಿದೆ</li>
                              <li>2 ಇತ್ತೀಚಿನ ಭರವಸೆಗಳು ತಪ್ಪಿವೆ ಅಥವಾ ತಡವಾಗಿವೆ</li>
                              <li>ಇತ್ತೀಚಿನ ಪಾವತಿ ಭಾಗಶಃ ಆಗಿತ್ತು</li>
                              <li>ಸರಾಸರಿ ಪಾವತಿ ವಿಳಂಬ 5 ದಿನಗಳು</li>
                            </>
                          ) : (
                            app.metadata?.evidence?.map((ev, i) => <li key={i}>{ev}</li>) || (
                              <>
                                <li>₹1,000 remains outstanding</li>
                                <li>2 recent promises were missed or late</li>
                                <li>Recent payment was partial</li>
                                <li>Average delay is 5 days</li>
                              </>
                            )
                          )}
                        </ul>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          {t.aiSuggestedAction}
                        </p>
                        <p className="text-xs font-medium text-slate-900 leading-relaxed">
                          {selectedLanguage === 'kn'
                            ? `ಪೂರ್ಣ ₹${reqAmount.toLocaleString('en-IN')} ನೀಡುವ ಮೊದಲು ಹಳೆಯ ಬಾಕಿಯನ್ನು ವಸೂಲಿ ಮಾಡಲು ಪರಿಗಣಿಸಿ.`
                            : app.metadata?.suggested_action || 'Consider collecting part of the existing balance before extending full credit.'}
                        </p>
                      </div>

                      <div className="pt-2 flex flex-wrap items-center gap-3">
                        <button
                          onClick={() => onApproveCredit(app.id, reqAmount)}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
                        >
                          <Check size={15} className="text-emerald-400" />
                          {t.approve} ₹{reqAmount.toLocaleString('en-IN')}
                        </button>

                        <button
                          onClick={() => setReducingApproval(app)}
                          className="bg-white border border-slate-300 hover:bg-amber-50 hover:border-amber-300 text-slate-800 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
                        >
                          <Edit3 size={14} className="text-amber-700" />
                          {t.reduceAmount}
                        </button>

                        <button
                          onClick={() => onDenyCredit(app.id)}
                          className="text-rose-700 hover:text-rose-900 hover:bg-rose-50 border border-rose-200 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                        >
                          <XCircle size={14} />
                          {t.dontGiveCredit}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* REMINDER CONTENT */}
                  {isReminder && (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          {selectedLanguage === 'kn' ? 'ಕಾರಣ:' : 'Reason:'}
                        </p>
                        <p className="text-xs font-semibold text-slate-800">
                          {selectedLanguage === 'kn' ? `${customer?.name} ಅವರು ಇಂದಿನ ₹2,000 ಪಾವತಿ ಭರವಸೆಯನ್ನು ತಪ್ಪಿದ್ದಾರೆ.` : app.reason}
                        </p>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                        <div className="flex justify-between items-center text-[11px] text-slate-500">
                          <span className="font-bold uppercase tracking-wider">{selectedLanguage === 'kn' ? 'ಸಂದೇಶ ಕರಡು' : 'Draft Message'}</span>
                          <span>WhatsApp / SMS Ready</span>
                        </div>
                        <p className="text-xs text-slate-900 italic bg-white p-3 rounded-lg border border-slate-200/80 leading-relaxed">
                          “{selectedLanguage === 'kn'
                            ? `ನಮಸ್ಕಾರ ${customer?.name} ಅವರೇ, ಇಂದು ನೀವು ಪಾವತಿಸುವುದಾಗಿ ತಿಳಿಸಿದ್ದ ₹2,000 ಬಗ್ಗೆ ಸೌಮ್ಯ ಜ್ಞಾಪನೆ. ಅನುಕೂಲವಾದಾಗ ದಯವಿಟ್ಟು ತಿಳಿಸಿ.`
                            : app.draft_content}”
                        </p>
                      </div>

                      <div className="pt-2 flex flex-wrap items-center gap-3">
                        <button
                          onClick={() => onApproveReminder(app.id)}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
                        >
                          <Send size={14} className="text-emerald-400" />
                          {t.approveAndSend}
                        </button>

                        <button
                          onClick={() => setEditingApproval(app)}
                          className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
                        >
                          <Edit3 size={14} />
                          {t.editDraft}
                        </button>

                        <button
                          onClick={() => onSkipReminder(app.id)}
                          className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors"
                        >
                          {t.skip}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Past Decisions Log */}
      {pastDecisions.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {t.recordedDecisions} ({pastDecisions.length})
          </h3>

          <div className="divide-y divide-slate-100 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            {pastDecisions.map((p) => {
              const cust = customers.find((c) => c.id === p.customer_id);
              return (
                <div key={p.id} className="p-4 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-900">
                      {p.type === 'REMINDER' ? (selectedLanguage === 'kn' ? 'ಜ್ಞಾಪನೆ' : 'Reminder') : (selectedLanguage === 'kn' ? 'ಸಾಲ ವಿಸ್ತರಣೆ' : 'Credit Extension')} · {cust?.name}
                    </p>
                    <p className="text-slate-500">
                      {p.decision_notes || p.reason}
                    </p>
                  </div>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-md ${
                      p.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {p.status === 'APPROVED' ? (selectedLanguage === 'kn' ? 'ಕಳುಹಿಸಲಾಗಿದೆ / ಮಂಜೂರಾಗಿದೆ' : 'SENT / APPROVED') : p.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {editingApproval && (
        <EditReminderModal
          approval={editingApproval}
          customerName={customers.find((c) => c.id === editingApproval.customer_id)?.name || 'Customer'}
          onClose={() => setEditingApproval(null)}
          onSaveAndSend={(updated) => {
            onEditReminderDraft(editingApproval.id, updated);
            setEditingApproval(null);
          }}
          selectedLanguage={selectedLanguage}
        />
      )}

      {reducingApproval && (
        <ReduceCreditModal
          approval={reducingApproval}
          customerName={customers.find((c) => c.id === reducingApproval.customer_id)?.name || 'Customer'}
          onClose={() => setReducingApproval(null)}
          onApproveReduced={(newAmt) => {
            onApproveCredit(reducingApproval.id, newAmt);
            setReducingApproval(null);
          }}
          selectedLanguage={selectedLanguage}
        />
      )}
    </div>
  );
};
