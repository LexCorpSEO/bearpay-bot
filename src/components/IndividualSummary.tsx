import React, { useState } from 'react';
import { Person, IndividualSummaryItem, Bill, BillParticipant } from '../types';
import { formatTHB, formatThaiDate, getDaysRemaining, generateSummaryLineMessage } from '../utils/thaiFormatters';
import { Send, QrCode, CheckCircle, ChevronDown, ChevronUp, AlertCircle, ArrowUpRight, ArrowDownLeft, Sparkles, MessageCircle } from 'lucide-react';
import { getPromptPayQRImageUrl } from '../utils/promptpay';

interface IndividualSummaryProps {
  summaries: IndividualSummaryItem[];
  myPromptPayTarget: string;
  myPromptPayName: string;
  onSendLineReminder: (person: Person, totalOwed: number, unpaidCount: number) => void;
  onShowPromptPayQr: (personName: string, amount: number) => void;
  onClearPersonDebt: (personId: string) => void;
}

export const IndividualSummary: React.FC<IndividualSummaryProps> = ({
  summaries,
  myPromptPayTarget,
  myPromptPayName,
  onSendLineReminder,
  onShowPromptPayQr,
  onClearPersonDebt,
}) => {
  const [expandedPersonId, setExpandedPersonId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedPersonId(prev => (prev === id ? null : id));
  };

  if (summaries.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center my-6">
        <div className="text-4xl mb-3">👥</div>
        <h3 className="text-lg font-bold text-slate-200">ยังไม่มีข้อมูลยอดคงเหลือรายบุคคล</h3>
        <p className="text-sm text-slate-400 mt-1">
          สร้างบิลหารค่าใช้จ่ายใหม่ เพื่อเริ่มต้นติดตามยอดหนี้แยกตามบุคคล
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 my-6">
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <span>สรุปยอดคงเหลือรายบุคคล</span>
            <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold px-2 py-0.5 rounded-full">
              {summaries.length} คน
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            ยอดสุทธิและรายการค้างชำระแยกตามเพื่อนแต่ละคน
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1  gap-4">
        {summaries.map(item => {
          const { person, totalOwedToMe, totalIOweThem, netBalance, unpaidBills } = item;
          const isExpanded = expandedPersonId === person.id;
          const isOwedToMe = netBalance > 0;
          const isIOwe = netBalance < 0;
          const isSettled = netBalance === 0;

          return (
            <div
              key={person.id}
              className={`bg-slate-900 border rounded-2xl p-4 transition-all shadow-sm ${
                isOwedToMe
                  ? 'border-emerald-500/30 hover:border-emerald-500/50'
                  : isIOwe
                  ? 'border-amber-500/30 hover:border-amber-500/50'
                  : 'border-slate-800'
              }`}
            >
              
              {/* Header Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-11 h-11 rounded-2xl ${person.avatarColor || 'bg-blue-500'} flex items-center justify-center text-white font-bold text-base shadow-inner`}>
                    {person.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-sm flex items-center space-x-1.5">
                      <span>{person.name}</span>
                      {person.phone && (
                        <span className="text-[11px] font-normal text-slate-400">({person.phone})</span>
                      )}
                    </h3>
                    <div className="flex items-center space-x-2 mt-0.5">
                      <span className="text-[11px] text-slate-400">
                        ค้าง {unpaidBills.length} รายการ
                      </span>
                      {person.lineId && (
                        <span className="text-[10px] text-emerald-400 font-medium bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-500/30">
                          {person.lineId}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Net Balance Status */}
                <div className="text-right">
                  {isOwedToMe && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        ติดคุณ
                      </span>
                      <div className="text-lg font-black text-emerald-400 mt-0.5">
                        {formatTHB(netBalance)}
                      </div>
                    </div>
                  )}

                  {isIOwe && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                        คุณติด
                      </span>
                      <div className="text-lg font-black text-amber-400 mt-0.5">
                        {formatTHB(Math.abs(netBalance))}
                      </div>
                    </div>
                  )}

                  {isSettled && (
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                        เคลียร์แล้ว
                      </span>
                      <div className="text-lg font-black text-slate-400 mt-0.5">
                        ฿0
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col  items-start  justify-between gap-3 mt-4 pt-3 border-t border-slate-800/80">
                <button
                  onClick={() => toggleExpand(person.id)}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1 font-medium transition-colors"
                >
                  <span>รายการย่อย ({unpaidBills.length})</span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                <div className="flex flex-wrap items-center gap-2 w-full  justify-start ">
                  {/* PromptPay QR Button */}
                  {isOwedToMe && (
                    <button
                      onClick={() => onShowPromptPayQr(person.name, netBalance)}
                      className="flex-1  px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px]  font-semibold flex items-center justify-center space-x-1 border border-slate-700 transition-all"
                      title="เปิด QR พร้อมเพย์เพื่อรับโอน"
                    >
                      <QrCode className="w-3.5 h-3.5 text-teal-400" />
                      <span>QR</span>
                    </button>
                  )}

                  {/* LINE Reminder Button */}
                  {isOwedToMe && (
                    <button
                      onClick={() => onSendLineReminder(person, netBalance, unpaidBills.length)}
                      className="flex-1  px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px]  font-bold flex items-center justify-center space-x-1.5 shadow-sm active:scale-95 transition-all"
                      title="ส่งข้อความทวงหนี้ผ่าน LINE"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>เตือนผ่าน LINE 🐥</span>
                    </button>
                  )}

                  {/* Mark All Paid / Settled */}
                  {unpaidBills.length > 0 && (
                    <button
                      onClick={() => onClearPersonDebt(person.id)}
                      className="flex-1  px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-300 text-[11px]  font-bold border border-emerald-500/40 flex items-center justify-center space-x-1 transition-all"
                      title="ชำระปิดหนี้ทั้งหมดของคุณคนนี้"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>🏆 ปิดหนี้</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Collapsible Unpaid Bills Breakdown */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-slate-800/60 space-y-2">
                  {unpaidBills.length === 0 ? (
                    <p className="text-xs text-slate-500 italic text-center py-2">
                      ไม่มีบิลค้างชำระ
                    </p>
                  ) : (
                    unpaidBills.map(({ bill, participant, isIOweThem }) => {
                      const daysInfo = getDaysRemaining(bill.dueDate);
                      return (
                        <div
                          key={bill.id}
                          className="bg-slate-950/70 rounded-xl p-2.5 border border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-semibold text-slate-200">
                              {bill.title}
                            </div>
                            <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                              <span>กำหนด: {formatThaiDate(bill.dueDate)}</span>
                              <span className={`font-medium ${
                                daysInfo.isOverdue ? 'text-rose-400' : 'text-slate-400'
                              }`}>
                                ({daysInfo.label})
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className={`font-bold text-sm ${
                              isIOweThem ? 'text-amber-400' : 'text-emerald-400'
                            }`}>
                              {formatTHB(participant.amount)}
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.2">
                              {participant.status === 'PENDING_SLIP' ? (
                                <span className="text-sky-300 bg-sky-950 px-1.5 py-0.2 rounded border border-sky-500/30 font-medium">
                                  รอตรวจสลิป
                                </span>
                              ) : (
                                <span className="text-slate-400">ยังไม่ชำระ</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

            </div>
          );
        })}
      </div>

    </div>
  );
};
