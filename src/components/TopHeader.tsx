import React from 'react';
import { Mic, MessageSquare, Globe, Database } from 'lucide-react';
import { LanguageCode, SUPPORTED_LANGUAGES, TRANSLATIONS } from '../utils/i18n';

interface TopHeaderProps {
  currentTab: string;
  onOpenAgent: (mode: 'VOICE' | 'TEXT') => void;
  selectedLanguage: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  totalCustomersCount: number;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentTab,
  onOpenAgent,
  selectedLanguage,
  onSelectLanguage,
  totalCustomersCount,
}) => {
  const t = TRANSLATIONS[selectedLanguage];

  const getTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return t.aiBriefingTitle;
      case 'customers':
        return t.customers;
      case 'promises':
        return t.promises;
      case 'approvals':
        return t.approvals;
      case 'activity':
        return t.activity;
      default:
        return t.appName;
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      <div className="flex items-center gap-3">
        <h2 className="text-sm md:text-base font-bold text-slate-900 tracking-tight truncate max-w-[220px] sm:max-w-none">
          {getTitle()}
        </h2>
        <span className="hidden sm:inline-block text-xs text-slate-500 font-medium">
          · {t.storeName}
        </span>
        <span className="hidden lg:inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-mono border border-emerald-200">
          <Database size={11} />
          {totalCustomersCount} {t.customers.toLowerCase()}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Language Selector in Top Bar */}
        <div className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300/80 px-2.5 py-1.5 rounded-xl transition-colors">
          <Globe size={13} className="text-amber-700 shrink-0" />
          <select
            value={selectedLanguage}
            onChange={(e) => onSelectLanguage(e.target.value as LanguageCode)}
            className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.nativeLabel} ({lang.label})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => onOpenAgent('TEXT')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
        >
          <MessageSquare size={14} />
          <span>{t.typeToMitra}</span>
        </button>

        <button
          onClick={() => onOpenAgent('VOICE')}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
        >
          <Mic size={14} className="text-amber-400" />
          <span>{t.talkToMitra}</span>
        </button>
      </div>
    </header>
  );
};
