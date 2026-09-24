import React from 'react';
import {
  LayoutDashboard,
  Users,
  Clock,
  CheckSquare,
  Activity,
  Mic,
  Sparkles,
  Store,
  Globe,
  Database
} from 'lucide-react';
import { LanguageCode, SUPPORTED_LANGUAGES, TRANSLATIONS } from '../utils/i18n';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  pendingApprovalsCount: number;
  onOpenAgent: (mode: 'VOICE' | 'TEXT') => void;
  selectedLanguage: LanguageCode;
  onSelectLanguage: (lang: LanguageCode) => void;
  totalCustomersCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingApprovalsCount,
  onOpenAgent,
  selectedLanguage,
  onSelectLanguage,
  totalCustomersCount,
}) => {
  const t = TRANSLATIONS[selectedLanguage];

  const navItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'customers', label: t.customers, icon: Users },
    { id: 'promises', label: t.promises, icon: Clock },
    {
      id: 'approvals',
      label: t.approvals,
      icon: CheckSquare,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
    },
    { id: 'activity', label: t.activity, icon: Activity },
  ];

  return (
    <aside className="w-64 bg-slate-950 text-slate-300 flex-shrink-0 hidden md:flex flex-col border-r border-slate-800 justify-between h-screen sticky top-0">
      <div>
        {/* Brand */}
        <div className="p-6 pb-4 border-b border-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold">
              <Sparkles size={16} />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white tracking-tight leading-none">
                {selectedLanguage === 'kn' ? 'ಉಧಾರ್ ಮಿತ್ರ' : 'Udhaar Mitra'}
              </h1>
              <p className="text-[11px] text-slate-400 font-medium mt-1">
                {t.appSubtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Primary Agent Voice CTA */}
        <div className="p-4 pb-2 space-y-2">
          <button
            onClick={() => onOpenAgent('VOICE')}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold p-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <Mic size={16} />
            <span>{t.talkToMitra}</span>
          </button>

          {/* Language Selector in Sidebar */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
            <Globe size={13} className="text-amber-400 shrink-0" />
            <span className="text-[11px] text-slate-400">{t.language}:</span>
            <select
              value={selectedLanguage}
              onChange={(e) => onSelectLanguage(e.target.value as LanguageCode)}
              className="bg-transparent text-white font-semibold text-xs focus:outline-none cursor-pointer flex-1"
            >
              {SUPPORTED_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                  {l.nativeLabel} ({l.label})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    size={16}
                    className={isActive ? 'text-amber-400' : 'text-slate-400'}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Store & Real Database Status */}
      <div className="p-4 border-t border-slate-900 space-y-2">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs space-y-1">
          <div className="flex items-center gap-2 text-slate-300 font-bold">
            <Store size={14} className="text-amber-400" />
            <span className="truncate">{t.storeName}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono pt-1 border-t border-slate-800">
            <Database size={11} />
            <span>{totalCustomersCount} {t.customers.toLowerCase()} · {t.liveDatabase}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
