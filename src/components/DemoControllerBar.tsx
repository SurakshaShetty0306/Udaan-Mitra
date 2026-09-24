import React, { useState } from 'react';
import {
  RotateCcw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CreditCard,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { LanguageCode, TRANSLATIONS } from '../utils/i18n';

interface DemoControllerBarProps {
  onSimulateMissedPromise: () => void;
  onSimulatePayment: () => void;
  onSimulateNewPromise: () => void;
  onSimulateCreditRequest: () => void;
  onResetDemo: () => void;
  onOpenAgentWithPhrase: (phrase: string) => void;
  selectedLanguage: LanguageCode;
}

export const DemoControllerBar: React.FC<DemoControllerBarProps> = ({
  onSimulateMissedPromise,
  onSimulatePayment,
  onSimulateNewPromise,
  onSimulateCreditRequest,
  onResetDemo,
  onOpenAgentWithPhrase,
  selectedLanguage,
}) => {
  const t = TRANSLATIONS[selectedLanguage];
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-white px-4 py-2.5 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* Left: Indicator */}
        <div className="flex items-center justify-between md:justify-start gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-bold text-amber-300 tracking-wider uppercase text-[11px]">
              {t.demoControllerTitle}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 hidden lg:inline">
            {t.demoControllerSubtitle}
          </span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="md:hidden text-slate-400 hover:text-white"
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>

        {/* Right / Buttons */}
        {isExpanded && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1 md:pt-0">
            <button
              onClick={() => onOpenAgentWithPhrase(t.samplePhrases[0])}
              title={selectedLanguage === 'kn' ? 'ಹಂತ 1: ₹2,000 ಸಾಲ ಮತ್ತು ಭರವಸೆ' : 'Step 1: Test credit entry'}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-colors"
            >
              <span>{t.demoStep1}</span>
            </button>

            <button
              onClick={onSimulateMissedPromise}
              title={selectedLanguage === 'kn' ? 'ಹಂತ 2: ಶುಕ್ರವಾರ ಹಣ ಬಾರದ ಸ್ಥಿತಿ' : 'Step 2: Simulate Friday passing'}
              className="bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800/60 px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-colors"
            >
              <AlertCircle size={13} className="text-rose-400" />
              <span>{t.demoStep2}</span>
            </button>

            <button
              onClick={onSimulateNewPromise}
              title={selectedLanguage === 'kn' ? 'ಹಂತ 3: ಸೋಮವಾರ ಹಣ ಕೊಡುವ ಭರವಸೆ' : 'Step 3: New commitment'}
              className="bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 border border-indigo-800/60 px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-colors"
            >
              <Clock size={13} className="text-indigo-400" />
              <span>{t.demoStep3}</span>
            </button>

            <button
              onClick={onSimulatePayment}
              title={selectedLanguage === 'kn' ? 'ಹಂತ 4: ₹1,000 ಭಾಗಶಃ ಪಾವತಿ' : 'Step 4: Partial payment'}
              className="bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border border-emerald-800/60 px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-colors"
            >
              <CreditCard size={13} className="text-emerald-400" />
              <span>{t.demoStep4}</span>
            </button>

            <button
              onClick={onSimulateCreditRequest}
              title={selectedLanguage === 'kn' ? 'ಹಂತ 5: ₹3,000 ಹೊಸ ಸಾಲದ ವಿಶ್ಲೇಷಣೆ' : 'Step 5: Amber recommendation'}
              className="bg-amber-950/80 hover:bg-amber-900 text-amber-200 border border-amber-800/60 px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-colors"
            >
              <ShieldAlert size={13} className="text-amber-400" />
              <span>{t.demoStep5}</span>
            </button>

            <button
              onClick={onResetDemo}
              title={selectedLanguage === 'kn' ? 'ಮೂಲ ಸ್ಥಿತಿಗೆ ಮರುಹೊಂದಿಸಿ' : 'Reset ledger data'}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-colors ml-1"
            >
              <RotateCcw size={13} />
              <span>{t.demoReset}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
