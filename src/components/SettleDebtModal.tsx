import React, { useState } from 'react';
import { Person, Bill, IndividualSummaryItem } from '../types';
import { formatTHB, formatThaiDate } from '../utils/thaiFormatters';
import { X, Trophy, CheckCircle2, Copy, Check, Send, Sparkles, ShieldCheck, DollarSign } from 'lucide-react';

interface SettleDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  people: Person[];
  bills: Bill[];
  summaries: IndividualSummaryItem[];
  onConfirmSettlePersonDebt: (personId: string) => void;
  onConfirmSettleBillDebt: (billId: string, personId?: string) => void;
}

export const SettleDebtModal: React.FC<SettleDebtModalProps> = ({
  isOpen,
  onClose,
  people,
  bills,
  summaries,
  onConfirmSettlePersonDebt,
  onConfirmSettleBillDebt,
}) => {
  const [selectedPersonId, setSelectedPersonId] = useState<string>(
    summaries.find(s => s.netBalance > 0 || s.unpaidBills.length > 0)?.person.id || people.filter(p => !p.isMe)[0]?.id || ''
  );
  const [settledSuccessCard, setSettledSuccessCard] = useState<{
    personName: string;
    amount: number;
    text: string;
  } | null>(null);

  const [copiedText, setCopiedText] = useState(false);

  if (!isOpen) return null;

  const currentSummary = summaries.find(s => s.person.id === selectedPersonId);
  const targetPerson = people.find(p => p.id === selectedPersonId);

  const totalOwedToMe = currentSummary ? currentSummary.totalOwedToMe : 0;
  const unpaidCount = currentSummary ? currentSummary.unpaidBills.length : 0;

  const handleSettleFullPersonDebt = () => {
    if (!targetPerson) return;
    if (unpaidCount === 0) {
      alert('บุคคลนี้ไม่มีรายการค้างชำระแล้ว');
      return;
    }

    const settledAmt = totalOwedToMe;

    // Trigger full person settlement
    onConfirmSettlePersonDebt(selectedPersonId);

    // Show celebratory receipt
    const lineText = `🏆 [BearPay (หมีเปย์) - หนังสือรับรองการปิดหนี้]\n\n🎉 ขอแสดงความยินดี! คุณ${targetPerson.name} ได้ทำการชำระปิดหนี้ทั้งหมดเรียบร้อยแล้ว!\n\n💵 ยอดปิดหนี้สุทธิ: ${formatTHB(settledAmt)}\n📌 สรุปยอดค้างชำระปัจจุบัน: 0.00 บาท (ไม่มีหนี้ค้าง) ✨\n\nขอบคุณที่ชำระตรงเวลา BearPay อัปเดตสถานะให้เรียบร้อยครับ! 🐻🏆`;

    setSettledSuccessCard({
      personName: targetPerson.name,
      amount: settledAmt,
      text: lineText,
    });
  };

  const handleSettleSingleBill = (billId: string) => {
    onConfirmSettleBillDebt(billId, selectedPersonId);
  };

  const handleCopyLineAnnouncement = () => {
    if (!settledSuccessCard) return;
    navigator.clipboard.writeText(settledSuccessCard.text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start  justify-center p-2  bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl my-auto max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-600/20 border-b border-slate-800 p-4  flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10   rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-xl  text-emerald-400 shadow-inner shrink-0">
              🏆
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base  font-black text-white tracking-tight">เคลียร์บัญชี</h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                ชำระยอดหนี้ทั้งหมดในครั้งเดียว
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSettledSuccessCard(null);
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-full transition-all shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4  space-y-5 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
          
          {/* Celebratory Settled Card Popup if just settled */}
          {settledSuccessCard ? (
            <div className="bg-slate-950 border-2 border-emerald-500/50 rounded-2xl p-5 space-y-4 text-center animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto text-3xl shadow-lg">
                🎉
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950 px-3 py-1 rounded-full border border-emerald-500/30">
                  ปิดหนี้เรียบร้อย 100%
                </span>
                <h3 className="text-xl font-black text-white mt-2">
                  คุณ{settledSuccessCard.personName} ปิดหนี้เรียบร้อย!
                </h3>
                <p className="text-2xl font-black text-emerald-400 mt-1">
                  {formatTHB(settledSuccessCard.amount)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  สถานะปัจจุบัน: เคลียร์ครบทุกบิล ไม่มียอดค้างชำระ ✨
                </p>
              </div>

              {/* LINE Notification Box */}
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-left space-y-2">
                <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                  <span>ข้อความประกาศปิดหนี้สำหรับส่งกลุ่ม LINE:</span>
                  <button
                    onClick={handleCopyLineAnnouncement}
                    className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg flex items-center space-x-1"
                  >
                    {copiedText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedText ? 'คัดลอกแล้ว' : 'คัดลอกข้อความ'}</span>
                  </button>
                </div>
                <pre className="text-[11px] text-slate-300 font-mono whitespace-pre-wrap bg-slate-950 p-2.5 rounded-lg border border-slate-800 leading-relaxed">
                  {settledSuccessCard.text}
                </pre>
              </div>

              <button
                onClick={() => setSettledSuccessCard(null)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all"
              >
                กลับสู่หน้าปิดหนี้
              </button>
            </div>
          ) : (
            <>
              {/* Person Select Box */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">เลือกเพื่อนที่ต้องการปิดหนี้:</label>
                <div className="grid grid-cols-2  gap-2">
                  {people.filter(p => !p.isMe).map(p => {
                    const isSelected = p.id === selectedPersonId;
                    const pSummary = summaries.find(s => s.person.id === p.id);
                    const owes = pSummary ? pSummary.totalOwedToMe : 0;

                    return (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPersonId(p.id)}
                        className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden ${
                          isSelected
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-bold text-xs text-white line-clamp-1">{p.name}</div>
                        <div className={`text-[11px] font-extrabold mt-1 ${owes > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {owes > 0 ? formatTHB(owes) : 'ปลอดหนี้'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Person Settlement Details Card */}
              {targetPerson && (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-2xl ${targetPerson.avatarColor || 'bg-emerald-500'} flex items-center justify-center text-white font-bold text-base shadow-inner`}>
                        {targetPerson.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-100 text-sm">{targetPerson.name}</h3>
                        <p className="text-xs text-slate-400">
                          ค้างชำระ {unpaidCount} บิล / รายการ
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold">ยอดติดหนี้รวม</div>
                      <div className="text-lg font-black text-emerald-400">{formatTHB(totalOwedToMe)}</div>
                    </div>
                  </div>

                  {/* Unpaid Bills List for this person */}
                  {currentSummary && currentSummary.unpaidBills.length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-slate-400">รายการค้างชำระที่สามารถเคลียร์ได้:</div>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                        {currentSummary.unpaidBills.map(({ bill, participant }) => (
                          <div
                            key={bill.id}
                            className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                          >
                            <div>
                              <div className="font-bold text-slate-200">{bill.title}</div>
                              <div className="text-[10px] text-slate-400">กำหนด: {formatThaiDate(bill.dueDate)}</div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-emerald-400">{formatTHB(participant.amount)}</span>
                              <button
                                onClick={() => handleSettleSingleBill(bill.id)}
                                className="px-2 py-1 bg-slate-800 hover:bg-emerald-950 hover:text-emerald-300 text-slate-300 text-[10px] font-bold rounded-lg border border-slate-700 transition-all"
                              >
                                ปิดบิลนี้
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-xs text-slate-400 bg-slate-900/50 rounded-xl border border-slate-800">
                      🎉 คุณ{targetPerson.name} ไม่มียอดค้างชำระ ปลอดหนี้ 100%!
                    </div>
                  )}

                  {/* 1-Click Settle All Debt Button */}
                  {unpaidCount > 0 && (
                    <button
                      onClick={handleSettleFullPersonDebt}
                      className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm rounded-xl flex items-center justify-center space-x-2 shadow-lg active:scale-98 transition-all"
                    >
                      <Trophy className="w-5 h-5 text-slate-950" />
                      <span>🏆 ปิดหนี้ทั้งหมดของคุณ {targetPerson.name} ({formatTHB(totalOwedToMe)})</span>
                    </button>
                  )}
                </div>
              )}
            </>
          )}

        </div>

      </div>
    </div>
  );
};
