import React, { useState } from 'react';
import { Bill, Person, PaymentStatus } from '../types';
import { formatTHB, formatThaiDate, getDaysRemaining } from '../utils/thaiFormatters';
import { Search, Filter, Calendar, Send, CheckCircle2, AlertCircle, Clock, ChevronRight, Sparkles, Image as ImageIcon } from 'lucide-react';

interface BillListProps {
  bills: Bill[];
  people: Person[];
  onSelectBill: (bill: Bill) => void;
  onSendBillReminder: (bill: Bill) => void;
  onOpenNewBill: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  FOOD: '🍔',
  TRAVEL: '✈️',
  RENT: '🏠',
  UTILITIES: '⚡',
  SHOPPING: '🛍️',
  ENTERTAINMENT: '🎬',
  OTHER: '📦',
};

export const BillList: React.FC<BillListProps> = ({
  bills,
  people,
  onSelectBill,
  onSendBillReminder,
  onOpenNewBill,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNPAID' | 'OVERDUE' | 'PENDING' | 'COMPLETED'>('ALL');

  // Filter bills
  const filteredBills = bills.filter(bill => {
    // Search query match
    const matchesSearch = bill.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bill.note && bill.note.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchesSearch) return false;

    // Status filter match
    if (statusFilter === 'ALL') return true;

    if (statusFilter === 'COMPLETED') return bill.isCompleted;

    const hasUnpaid = bill.participants.some(p => p.status === 'UNPAID');
    const hasPending = bill.participants.some(p => p.status === 'PENDING_SLIP');
    const daysInfo = getDaysRemaining(bill.dueDate);

    if (statusFilter === 'UNPAID') return hasUnpaid && !bill.isCompleted;
    if (statusFilter === 'OVERDUE') return daysInfo.isOverdue && hasUnpaid && !bill.isCompleted;
    if (statusFilter === 'PENDING') return hasPending && !bill.isCompleted;

    return true;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4  shadow-sm my-6">
      
      {/* Search & Filter Header */}
      <div className="flex flex-col   justify-between gap-3 mb-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <span>รายการบิลและค่าใช้จ่ายทั้งหมด</span>
            <span className="text-xs bg-slate-800 text-slate-300 font-semibold px-2.5 py-0.5 rounded-full border border-slate-700">
              {filteredBills.length} บิล
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            บันทึกค่าใช้จ่าย กำหนดวันชำระ และสถานะการโอนของเพื่อน
          </p>
        </div>

        {/* Filter Tabs & Search Box */}
        <div className="flex flex-col  items-stretch  gap-2">
          
          {/* Search Box */}
          <div className="relative flex-1 ">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อบิล หรือ หมายเหตุ..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/50 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none transition-all"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                statusFilter === 'ALL' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setStatusFilter('UNPAID')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                statusFilter === 'UNPAID' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              รอชำระ
            </button>
            <button
              onClick={() => setStatusFilter('OVERDUE')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                statusFilter === 'OVERDUE' ? 'bg-rose-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              เกินกำหนด
            </button>
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                statusFilter === 'PENDING' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              รอตรวจสลิป
            </button>
            <button
              onClick={() => setStatusFilter('COMPLETED')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                statusFilter === 'COMPLETED' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              เคลียร์แล้ว
            </button>
          </div>

        </div>
      </div>

      {/* Bill List Display */}
      {filteredBills.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
          <div className="text-4xl mb-3">🧾</div>
          <h3 className="text-base font-bold text-slate-300">ไม่พบรายการบิลในหมวดหมู่นี้</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            ลองปรับคำค้นหา หรือสร้างบิลหารค่าใช้จ่ายใหม่
          </p>
          <button
            onClick={onOpenNewBill}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all"
          >
            + สร้างบิลใหม่
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBills.map(bill => {
            const daysInfo = getDaysRemaining(bill.dueDate);
            const unpaidCount = bill.participants.filter(p => p.status === 'UNPAID').length;
            const pendingCount = bill.participants.filter(p => p.status === 'PENDING_SLIP').length;
            const paidCount = bill.participants.filter(p => p.status === 'PAID').length;
            const totalParticipants = bill.participants.length;

            return (
              <div
                key={bill.id}
                className={`bg-slate-950/80 border rounded-2xl p-4 hover:bg-slate-900 transition-all cursor-pointer group relative overflow-hidden ${
                  bill.isCompleted
                    ? 'border-slate-800/80 opacity-75'
                    : daysInfo.isOverdue && unpaidCount > 0
                    ? 'border-rose-500/40 hover:border-rose-500/70'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
                onClick={() => onSelectBill(bill)}
              >
                <div className="flex flex-col   justify-between gap-3">
                  
                  {/* Left Column: Icon, Title & Date */}
                  <div className="flex items-start space-x-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-2xl flex-shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                      {CATEGORY_ICONS[bill.category] || '📦'}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <h3 className="font-bold text-slate-100 text-base group-hover:text-emerald-400 transition-colors">
                          {bill.title}
                        </h3>

                        {/* Due Date Badge */}
                        {bill.installmentConfig?.isInstallment && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                            📅 ผ่อน{bill.installmentConfig.frequency === 'DAILY' ? 'วันต่อวัน' : bill.installmentConfig.frequency === 'WEEKLY' ? 'สัปดาห์' : 'รายเดือน'}
                          </span>
                        )}

                        {bill.isCompleted ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                            ✓ เคลียร์ครบแล้ว
                          </span>
                        ) : daysInfo.isOverdue ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-500/40 animate-pulse">
                            🚨 {daysInfo.label}
                          </span>
                        ) : daysInfo.days === 0 ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/40">
                            🔥 {daysInfo.label}
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                            🗓️ {daysInfo.label}
                          </span>
                        )}

                        {bill.receiptImageUrl && (
                          <span className="text-[10px] bg-indigo-950 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30 flex items-center space-x-1">
                            <ImageIcon className="w-3 h-3" />
                            <span>สแกนสลิป/ใบเสร็จ</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                        {bill.note || `สร้างเมื่อ ${formatThaiDate(bill.createdAt)} • กำหนดชำระ ${formatThaiDate(bill.dueDate)}`}
                      </p>

                      {/* Participant Chips */}
                      <div className="flex items-center space-x-1.5 mt-2.5 flex-wrap gap-y-1">
                        {bill.participants.map(part => {
                          const person = people.find(p => p.id === part.personId) || { name: 'เพื่อน', avatarColor: 'bg-slate-700' };
                          
                          let statusDot = 'bg-amber-400';
                          if (part.status === 'PAID') statusDot = 'bg-emerald-400';
                          if (part.status === 'PENDING_SLIP') statusDot = 'bg-sky-400 animate-ping';

                          return (
                            <div
                              key={part.personId}
                              className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] border ${
                                part.status === 'PAID'
                                  ? 'bg-slate-900/80 border-slate-800 text-slate-400'
                                  : part.status === 'PENDING_SLIP'
                                  ? 'bg-sky-950/80 border-sky-500/40 text-sky-200'
                                  : 'bg-slate-900 border-slate-700 text-slate-200'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                              <span>{person.name}</span>
                              <span className="font-semibold text-[10px]">
                                ({formatTHB(part.amount)})
                              </span>
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  </div>

                  {/* Right Column: Amount, Progress & Trigger Reminder */}
                  <div className="flex  items-center  justify-between border-t  border-slate-800/80 pt-2.5 ">
                    <div className="text-left ">
                      <div className="text-xs text-slate-400 font-medium">ยอดรวมบิล</div>
                      <div className="text-lg font-black text-white">
                        {formatTHB(bill.totalAmount)}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        ชำระแล้ว {paidCount}/{totalParticipants} คน
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 mt-2">
                      {!bill.isCompleted && unpaidCount > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSendBillReminder(bill);
                          }}
                          className="px-2.5 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center space-x-1 transition-all"
                          title="ส่งไลน์แจ้งเตือนบิลนี้"
                        >
                          <Send className="w-3 h-3" />
                          <span>เตือน LINE</span>
                        </button>
                      )}

                      <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
