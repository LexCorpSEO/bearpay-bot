import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Wallet, AlertCircle, Sparkles, Send } from 'lucide-react';
import { formatTHB } from '../utils/thaiFormatters';

interface DashboardCardsProps {
  totalOwedToMe: number;
  totalIOweThem: number;
  netBalance: number;
  overdueBillsCount: number;
  pendingSlipsCount: number;
  onSendAllReminders: () => void;
}

export const DashboardCards: React.FC<DashboardCardsProps> = ({
  totalOwedToMe,
  totalIOweThem,
  netBalance,
  overdueBillsCount,
  pendingSlipsCount,
  onSendAllReminders,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      
      {/* 1. Total Owed To Me */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:border-emerald-500/40 transition-all">
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400">เพื่อนติดเราทั้งหมด</span>
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-emerald-400 tracking-tight">
          {formatTHB(totalOwedToMe)}
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          รอรับคืนจากเพื่อนตามกำหนดชำระ
        </p>
      </div>

      {/* 2. Total I Owe Others */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:border-amber-500/40 transition-all">
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-all" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400">เราติดเพื่อนทั้งหมด</span>
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-black text-amber-400 tracking-tight">
          {formatTHB(totalIOweThem)}
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          ต้องโอนคืนเพื่อนให้ตรงเวลา
        </p>
      </div>

      {/* 3. Net Balance */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:border-teal-500/40 transition-all">
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-teal-500/10 rounded-full blur-xl group-hover:bg-teal-500/20 transition-all" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-400">ยอดคงเหลือสุทธิ</span>
          <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className={`text-2xl font-black tracking-tight ${
          netBalance >= 0 ? 'text-teal-300' : 'text-rose-400'
        }`}>
          {netBalance >= 0 ? `+${formatTHB(netBalance)}` : formatTHB(netBalance)}
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          {netBalance >= 0 ? 'สุทธิแล้วเราเป็นฝ่ายรับคืน' : 'สุทธิแล้วเราต้องจ่ายเพื่อน'}
        </p>
      </div>

      {/* 4. Action Card & Alerts */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">สถานะที่ต้องติดตาม</span>
          <div className="flex space-x-1">
            {overdueBillsCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                เกินกำหนด {overdueBillsCount}
              </span>
            )}
            {pendingSlipsCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30">
                รอตรวจสลิป {pendingSlipsCount}
              </span>
            )}
          </div>
        </div>

        <div className="my-2">
          <p className="text-xs text-slate-300 font-medium">
            ส่งแจ้งเตือนผ่าน LINE ทวงหนี้เพื่อนทุกรายการที่ถึงกำหนด
          </p>
        </div>

        <button
          onClick={onSendAllReminders}
          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
        >
          <Send className="w-3.5 h-3.5" />
          <span>เตือนหนี้ทั้งหมดผ่าน LINE 🐥</span>
        </button>
      </div>

    </div>
  );
};
