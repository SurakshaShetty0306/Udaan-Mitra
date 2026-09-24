import React, { useState } from 'react';
import { X, Send, Check, ShieldAlert, Sparkles } from 'lucide-react';
import { Approval } from '../types';
import { LanguageCode, TRANSLATIONS } from '../utils/i18n';

interface EditReminderModalProps {
  approval: Approval;
  customerName: string;
  onClose: () => void;
  onSaveAndSend: (updatedDraft: string) => void;
  selectedLanguage: LanguageCode;
}

export const EditReminderModal: React.FC<EditReminderModalProps> = ({
  approval,
  customerName,
  onClose,
  onSaveAndSend,
  selectedLanguage,
}) => {
  const t = TRANSLATIONS[selectedLanguage];
  const [draft, setDraft] = useState(approval.draft_content);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-amber-400" />
            <h3 className="font-bold text-sm text-white">
              {selectedLanguage === 'kn'
                ? `${customerName} ಅವರಿಗೆ ಜ್ಞಾಪನೆ ಸಂದೇಶ ತಿದ್ದುಪಡಿ`
                : `Edit Reminder for ${customerName}`}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600">
            <strong>{selectedLanguage === 'kn' ? 'AI ಕಾರಣ:' : 'AI Context:'}</strong> {approval.reason}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
              {t.messageDraft}
            </label>
            <textarea
              rows={4}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          <p className="text-xs text-slate-500 italic">
            {t.philosophyQuote}
          </p>
        </div>

        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
          >
            {t.cancel}
          </button>
          <button
            onClick={() => onSaveAndSend(draft)}
            className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex items-center gap-1.5"
          >
            <Send size={14} />
            {t.saveAndSend}
          </button>
        </div>
      </div>
    </div>
  );
};

interface ReduceCreditModalProps {
  approval: Approval;
  customerName: string;
  onClose: () => void;
  onApproveReduced: (newAmount: number) => void;
  selectedLanguage: LanguageCode;
}

export const ReduceCreditModal: React.FC<ReduceCreditModalProps> = ({
  approval,
  customerName,
  onClose,
  onApproveReduced,
  selectedLanguage,
}) => {
  const t = TRANSLATIONS[selectedLanguage];
  const original = approval.metadata?.original_amount || approval.metadata?.requested_amount || 3000;
  const [reducedAmount, setReducedAmount] = useState<number>(Math.floor(original / 2));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
        <div className="bg-amber-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert size={18} className="text-amber-400" />
            <h3 className="font-bold text-sm text-white">
              {selectedLanguage === 'kn'
                ? `${customerName} ಅವರಿಗೆ ಸಾಲದ ಮೊತ್ತ ಕಡಿತಗೊಳಿಸಿ`
                : `Reduce Credit for ${customerName}`}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
            <p className="font-semibold mb-1">{selectedLanguage === 'kn' ? 'AI ಶಿಫಾರಸು ಸಂದರ್ಭ:' : 'AI Recommendation Context:'}</p>
            <p>{approval.draft_content}</p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700 uppercase">
                {selectedLanguage === 'kn' ? 'ಮೂಲ ವಿನಂತಿ' : 'Original Request'}
              </label>
              <span className="font-mono text-sm font-semibold text-slate-500 line-through">
                ₹{original.toLocaleString('en-IN')}
              </span>
            </div>

            <label className="block text-xs font-bold text-slate-700 uppercase mt-4 mb-2">
              {t.reducedAmountLabel}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                step="100"
                min="100"
                max={original}
                value={reducedAmount}
                onChange={(e) => setReducedAmount(Number(e.target.value))}
                className="w-full pl-8 pr-4 py-2.5 text-base font-bold font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="flex gap-2 mt-2">
              {[500, 1000, 1500, 2000].map((quick) => (
                <button
                  key={quick}
                  onClick={() => setReducedAmount(quick)}
                  className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-amber-100 rounded-md font-mono text-slate-700"
                >
                  ₹{quick}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
          >
            {t.cancel}
          </button>
          <button
            onClick={() => onApproveReduced(reducedAmount)}
            className="px-4 py-2 text-xs font-semibold bg-amber-700 text-white rounded-lg hover:bg-amber-800 flex items-center gap-1.5"
          >
            <Check size={14} />
            {selectedLanguage === 'kn'
              ? `₹${reducedAmount.toLocaleString('en-IN')} ಮಂಜೂರು ಮಾಡಿ`
              : `Approve Reduced ₹${reducedAmount.toLocaleString('en-IN')}`}
          </button>
        </div>
      </div>
    </div>
  );
};
