import React from 'react';
import { Home, Receipt, MessageSquare, Settings, Plus, Users, Wallet } from 'lucide-react';

export type MobileTab = 'HOME' | 'FRIENDS' | 'BILLS' | 'LINE_BOT' | 'SETTINGS';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  onOpenNewTransactionModal: () => void;
  onOpenNewBillModal: () => void;
}

export function MobileBottomNav({
  activeTab,
  onTabChange,
  onOpenNewTransactionModal,
  onOpenNewBillModal,
}: MobileBottomNavProps) {
  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      try {
        navigator.vibrate(12);
      } catch (e) {
        // ignore
      }
    }
  };

  const handleSelectTab = (tab: MobileTab) => {
    triggerHaptic();
    onTabChange(tab);
  };

  const handleCenterPlusClick = () => {
    triggerHaptic();
    onOpenNewTransactionModal();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/80 px-2 pb-safe pt-1.5 shadow-[0_-10px_25px_rgba(0,0,0,0.5)]">
      <div className="max-w-7xl mx-auto flex items-center justify-between relative px-1">
        
        {/* Tab 1: Home (Personal Ledger) */}
        <button
          onClick={() => handleSelectTab('HOME')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all rounded-xl ${
            activeTab === 'HOME'
              ? 'text-amber-400 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <Home className={`w-5 h-5 ${activeTab === 'HOME' ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : ''}`} />
          <span className="text-[10px] mt-1 tracking-tight">หน้าหลัก</span>
        </button>

        {/* Tab 2: Friends Debts */}
        <button
          onClick={() => handleSelectTab('FRIENDS')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all rounded-xl ${
            activeTab === 'FRIENDS'
              ? 'text-amber-400 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <Users className={`w-5 h-5 ${activeTab === 'FRIENDS' ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : ''}`} />
          <span className="text-[10px] mt-1 tracking-tight">เพื่อน</span>
        </button>

        {/* Center Floating Quick Add (+) Button for Personal Ledger */}
        <div className="relative -top-5 flex-1 flex justify-center items-center">
          <div className="relative">
            <button
              onClick={handleCenterPlusClick}
              className="w-13 h-13 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-400 text-slate-950 font-bold shadow-xl flex items-center justify-center border-4 border-slate-950 active:scale-90 transition-all hover:brightness-110 group z-10 relative"
              title="จดรายการใหม่ (ส่วนตัว)"
            >
              <Plus className="w-7 h-7 stroke-[3] group-hover:rotate-90 transition-transform duration-300" />
            </button>
            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-max mt-2">
              <span className="text-[10px] font-bold text-amber-400 tracking-tight drop-shadow-md">จดส่วนตัว</span>
            </div>
          </div>
        </div>

        {/* Tab 3: Split Bills */}
        <button
          onClick={() => handleSelectTab('BILLS')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all rounded-xl ${
            activeTab === 'BILLS'
              ? 'text-amber-400 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <Receipt className={`w-5 h-5 ${activeTab === 'BILLS' ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : ''}`} />
          <span className="text-[10px] mt-1 tracking-tight">บิลหาร</span>
        </button>

        {/* Tab 4: LINE Bot */}
        <button
          onClick={() => handleSelectTab('LINE_BOT')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 transition-all rounded-xl ${
            activeTab === 'LINE_BOT'
              ? 'text-emerald-400 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <MessageSquare className={`w-5 h-5 ${activeTab === 'LINE_BOT' ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]' : ''}`} />
          <span className="text-[10px] mt-1 tracking-tight">LINE Bot</span>
        </button>

      </div>
    </div>
  );
}
