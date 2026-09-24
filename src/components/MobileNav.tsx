import React from 'react';
import { LayoutDashboard, Users, Clock, CheckSquare, Activity } from 'lucide-react';
import { LanguageCode, TRANSLATIONS } from '../utils/i18n';

interface MobileNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  pendingApprovalsCount: number;
  selectedLanguage: LanguageCode;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentTab,
  onSelectTab,
  pendingApprovalsCount,
  selectedLanguage,
}) => {
  const t = TRANSLATIONS[selectedLanguage];

  const items = [
    { id: 'dashboard', label: t.home, icon: LayoutDashboard },
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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-950 text-slate-400 border-t border-slate-800 z-40 px-2 py-1 flex items-center justify-around">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`p-2 flex flex-col items-center relative transition-colors ${
              isActive ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Icon size={19} />
              {item.badge !== undefined && (
                <span className="absolute -top-1 -right-2 bg-amber-500 text-slate-950 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-1">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
