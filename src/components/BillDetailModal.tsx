import React, { useState } from 'react';
import { Bill, Person, PaymentStatus, PromptPayConfig } from '../types';
import { formatTHB, formatThaiDate, getDaysRemaining } from '../utils/thaiFormatters';
import { getPromptPayQRImageUrl } from '../utils/promptpay';
import { X, QrCode, Send, CheckCircle2, AlertCircle, Clock, Upload, Camera, Sparkles, Loader2, Image as ImageIcon, Trash2 } from 'lucide-react';

import { compressImageForAI } from '../utils/imageCompressor';

interface BillDetailModalProps {
  bill: Bill | null;
  people: Person[];
  myPromptPay: PromptPayConfig;
  isOpen: boolean;
  onClose: () => void;
  onUpdateParticipantStatus: (billId: string, personId: string, status: PaymentStatus, slipUrl?: string, notes?: string) => void;
  onSendParticipantReminder: (bill: Bill, person: Person, amount: number) => void;
  onDeleteBill: (billId: string) => void;
}

export const BillDetailModal: React.FC<BillDetailModalProps> = ({
  bill,
  people,
  myPromptPay,
  isOpen,
  onClose,
  onUpdateParticipantStatus,
  onSendParticipantReminder,
  onDeleteBill,
}) => {
  if (!isOpen || !bill) return null;

  const [selectedPersonForQr, setSelectedPersonForQr] = useState<Person | null>(null);
  const [selectedPersonForSlip, setSelectedPersonForSlip] = useState<Person | null>(null);

  // Gemini Slip verification state
  const [slipBase64, setSlipBase64] = useState<string | null>(null);
  const [isVerifyingSlip, setIsVerifyingSlip] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [slipError, setSlipError] = useState<string | null>(null);

  const daysInfo = getDaysRemaining(bill.dueDate);

  // Handle Slip Upload & Gemini Scan
  const handleSlipUpload = async (e: React.ChangeEvent<HTMLInputElement>, person: Person, expectedAmount: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsVerifyingSlip(true);
    setSlipError(null);
    setVerificationResult(null);

    try {
      const compressed = await compressImageForAI(file, 1200, 0.82);
      setSlipBase64(compressed.dataUrl);

      const res = await fetch('/api/gemini/scan-slip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: compressed.base64Data,
          mimeType: compressed.mimeType,
          expectedAmount,
          debtorName: person.name,
        }),
      });

      const result = await res.json();
      if (result.success && result.data) {
        setVerificationResult(result.data);
      } else {
        setSlipError(result.error || 'ไม่สามารถตรวจสอบสลิปได้');
      }
    } catch (err) {
      setSlipError('เกิดข้อผิดพลาดในการส่งไฟล์สลิป');
    } finally {
      setIsVerifyingSlip(false);
    }
  };

  const confirmSlipPayment = (personId: string, amount: number) => {
    onUpdateParticipantStatus(
      bill.id,
      personId,
      'PAID',
      slipBase64 || undefined,
      verificationResult?.summaryNote || 'โอนสลิปเรียบร้อยแล้ว'
    );
    setSelectedPersonForSlip(null);
    setSlipBase64(null);
    setVerificationResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start  justify-center p-2  bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl my-auto max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4  border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center text-xl font-bold shrink-0">
              🧾
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{bill.title}</h2>
              <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5 flex-wrap">
                <span>สร้างเมื่อ {formatThaiDate(bill.createdAt)}</span>
                <span>•</span>
                <span className={daysInfo.isOverdue ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                  กำหนดชำระ {formatThaiDate(bill.dueDate)} ({daysInfo.label})
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4  space-y-5 overflow-y-auto flex-1 min-h-0">
          
          {/* Overview Cards */}
          <div className="grid grid-cols-2  gap-3">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400">ยอดรวมบิล</span>
              <div className="text-lg font-black text-emerald-400">{formatTHB(bill.totalAmount)}</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <span className="text-[11px] text-slate-400">รูปแบบการหาร</span>
              <div className="text-sm font-bold text-slate-200 mt-0.5">
                {bill.splitMethod === 'EQUAL' && '⚖️ หารเท่ากัน'}
                {bill.splitMethod === 'EXACT' && '🔢 ระบุยอด'}
                {bill.splitMethod === 'ITEMIZED' && '📜 ตามรายการ'}
                {bill.splitMethod === 'INSTALLMENT' && (
                  <span className="text-emerald-400">
                    📅 ผ่อนชำระ ({bill.installmentConfig?.frequency === 'DAILY' ? 'แยกวันต่อวัน' : bill.installmentConfig?.frequency === 'WEEKLY' ? 'รายสัปดาห์' : 'รายเดือน'})
                  </span>
                )}
              </div>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 col-span-2 ">
              <span className="text-[11px] text-slate-400">สถานะบิล</span>
              <div className="text-sm font-bold mt-0.5">
                {bill.isCompleted ? (
                  <span className="text-emerald-400 flex items-center space-x-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>เคลียร์ครบแล้ว</span>
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>กำลังติดตามเก็บเงิน</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Receipt Image if present */}
          {bill.receiptImageUrl && (
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <span className="text-xs font-semibold text-slate-300 block mb-2 flex items-center space-x-1">
                <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
                <span>รูปใบเสร็จ / หลักฐานบิล</span>
              </span>
              <img
                src={bill.receiptImageUrl}
                alt="Receipt"
                className="w-full max-h-48 object-contain rounded-xl border border-slate-800 bg-slate-900"
              />
            </div>
          )}

          {/* Note */}
          {bill.note && (
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs text-slate-300">
              <strong className="text-slate-400">หมายเหตุ:</strong> {bill.note}
            </div>
          )}

          {/* Daily Installment Breakdown Schedule if available */}
          {bill.installmentConfig && bill.installmentConfig.dailySchedule && bill.installmentConfig.dailySchedule.length > 0 && (
            <div className="bg-slate-950/90 border border-emerald-500/30 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  <span>ตารางผ่อนชำระ{bill.installmentConfig.frequency === 'DAILY' ? 'แยกวันต่อวัน' : bill.installmentConfig.frequency === 'WEEKLY' ? 'รายสัปดาห์' : 'รายเดือน'} ({bill.installmentConfig.dailySchedule.length} รายการ)</span>
                </h3>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                  {formatTHB(bill.installmentConfig.installmentAmountPerPerson)} / คน / {bill.installmentConfig.frequency === 'DAILY' ? 'วัน' : 'งวด'}
                </span>
              </div>

              <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                {bill.installmentConfig.dailySchedule.map((item) => (
                  <div
                    key={item.dayIndex}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-[11px] border border-emerald-500/30">
                        {bill.installmentConfig?.frequency === 'DAILY' ? `วันที่ ${item.dayIndex}` : `งวดที่ ${item.dayIndex}`}
                      </span>
                      <span className="text-slate-200 font-medium">{formatThaiDate(item.date)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-black text-emerald-400">{formatTHB(item.amount)}</span>
                      <span className="text-[10px] text-slate-400 font-medium">/ คน</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Participant Payment Tracking List */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                รายชื่อผู้ร่วมหารและสถานะการโอนเงิน ({bill.participants.length} คน)
              </h3>

              {/* Settle Entire Bill Button */}
              {!bill.isCompleted && (
                <button
                  onClick={() => {
                    bill.participants.forEach(p => {
                      if (p.status !== 'PAID') {
                        onUpdateParticipantStatus(bill.id, p.personId, 'PAID');
                      }
                    });
                  }}
                  className="px-2.5 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center space-x-1.5 transition-all"
                  title="ชำระปิดหนี้ทุกคนในบิลนี้เรียบร้อย"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>🏆 ปิดหนี้บิลนี้ทั้งหมด</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              {bill.participants.map(part => {
                const person = people.find(p => p.id === part.personId) || {
                  name: 'เพื่อน',
                  avatarColor: 'bg-slate-700',
                  phone: '',
                };

                const isPaid = part.status === 'PAID';
                const isPending = part.status === 'PENDING_SLIP';

                return (
                  <div
                    key={part.personId}
                    className={`bg-slate-950 p-3.5 rounded-2xl border transition-all ${
                      isPaid
                        ? 'border-emerald-500/20 bg-slate-950/60'
                        : isPending
                        ? 'border-sky-500/40 bg-sky-950/20'
                        : 'border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col   justify-between gap-3">
                      
                      {/* Left: Avatar & Name */}
                      <div className="flex items-center space-x-3">
                        <div className={`w-9 h-9 rounded-xl ${person.avatarColor} text-white font-bold text-xs flex items-center justify-center`}>
                          {person.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-200 text-sm flex items-center space-x-2">
                            <span>{person.name}</span>
                            <span className="text-xs font-black text-emerald-400">
                              {formatTHB(part.amount)}
                            </span>
                          </div>
                          {part.slipNotes && (
                            <p className="text-[11px] text-sky-300 mt-0.5">💬 {part.slipNotes}</p>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions & Status */}
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        
                        {/* Status Badge */}
                        {isPaid ? (
                          <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>ชำระแล้ว</span>
                          </span>
                        ) : isPending ? (
                          <span className="px-2.5 py-1 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-bold flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>รอตรวจสลิป</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold">
                            ยังไม่ชำระ
                          </span>
                        )}

                        {/* PromptPay QR Trigger */}
                        {!isPaid && myPromptPay.target && (
                          <button
                            onClick={() => setSelectedPersonForQr(person)}
                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-400 border border-slate-700 transition-colors"
                            title="สแกน QR พร้อมเพย์"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                        )}

                        {/* Send LINE Alert Button */}
                        {!isPaid && (
                          <button
                            onClick={() => onSendParticipantReminder(bill, person, part.amount)}
                            className="p-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-colors"
                            title="ส่งไลน์ทวงเตือน"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}

                        {/* Upload & Gemini Scan Slip */}
                        {!isPaid && (
                          <button
                            onClick={() => setSelectedPersonForSlip(person)}
                            className="p-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 transition-colors"
                            title="แนบสลิป/ตรวจสลิปด้วย AI"
                          >
                            <Upload className="w-4 h-4" />
                          </button>
                        )}

                        {/* Toggle Status manually */}
                        <button
                          onClick={() => onUpdateParticipantStatus(bill.id, part.personId, isPaid ? 'UNPAID' : 'PAID')}
                          className="text-[11px] text-slate-400 hover:text-slate-200 underline ml-1"
                        >
                          {isPaid ? 'เปลี่ยนเป็นยังไม่ชำระ' : 'ทำเครื่องหมายจ่ายแล้ว'}
                        </button>

                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* QR Code Popover Modal / Section */}
          {selectedPersonForQr && myPromptPay.target && (
            <div className="bg-slate-950 p-4 rounded-2xl border border-teal-500/40 text-center space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-300 flex items-center space-x-1">
                  <QrCode className="w-4 h-4" />
                  <span>PromptPay QR สำหรับ {selectedPersonForQr.name}</span>
                </span>
                <button
                  onClick={() => setSelectedPersonForQr(null)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  ปิด
                </button>
              </div>

              {/* Generated QR Code Image */}
              <div className="bg-white p-3 rounded-2xl w-48 h-48 mx-auto shadow-lg">
                <img
                  src={getPromptPayQRImageUrl(
                    myPromptPay.target,
                    bill.participants.find(p => p.personId === selectedPersonForQr.id)?.amount || 0
                  )}
                  alt="PromptPay QR"
                  className="w-full h-full object-contain"
                />
              </div>

              <p className="text-xs text-slate-300 font-medium">
                พร้อมเพย์: <strong className="text-teal-400">{myPromptPay.target}</strong> ({myPromptPay.name})
              </p>
            </div>
          )}

          {/* Slip Upload & Gemini Slip Scanner Section */}
          {selectedPersonForSlip && (
            <div className="bg-slate-950 p-4 rounded-2xl border border-sky-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-300 flex items-center space-x-1">
                  <Sparkles className="w-4 h-4" />
                  <span>แนบและสแกนสลิปโอนเงินของ {selectedPersonForSlip.name} ด้วย AI</span>
                </span>
                <button
                  onClick={() => {
                    setSelectedPersonForSlip(null);
                    setSlipBase64(null);
                    setVerificationResult(null);
                  }}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  ปิด
                </button>
              </div>

              {slipBase64 && (
                <div className="relative w-32 h-32 mx-auto rounded-xl overflow-hidden border border-slate-700">
                  <img src={slipBase64} alt="Slip" className="w-full h-full object-cover" />
                </div>
              )}

              {isVerifyingSlip ? (
                <div className="flex flex-col items-center justify-center space-y-2 py-3">
                  <Loader2 className="w-6 h-6 text-sky-400 animate-spin" />
                  <span className="text-xs text-sky-300">Gemini AI กำลังตรวจสอบความถูกต้องของสลิป...</span>
                </div>
              ) : (
                <label className="flex items-center justify-center space-x-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer transition-all">
                  <Camera className="w-4 h-4" />
                  <span>เลือกรูปสลิปโอนเงิน</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleSlipUpload(
                      e,
                      selectedPersonForSlip,
                      bill.participants.find(p => p.personId === selectedPersonForSlip.id)?.amount || 0
                    )}
                    className="hidden"
                  />
                </label>
              )}

              {/* Gemini Slip Verification Results */}
              {verificationResult && (
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-slate-200">ผลการวิเคราะห์ด้วย AI:</span>
                    {verificationResult.isAmountMatch ? (
                      <span className="text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30">
                        ✓ ยอดเงินตรงกัน
                      </span>
                    ) : (
                      <span className="text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-500/30">
                        ⚠️ ยอดเงินต่างกัน
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300"><strong>ผู้โอน:</strong> {verificationResult.payerName || '-'}</p>
                  <p className="text-slate-300"><strong>ผู้รับ:</strong> {verificationResult.receiverName || '-'}</p>
                  <p className="text-slate-300"><strong>จำนวนเงินในสลิป:</strong> ฿{verificationResult.amount}</p>
                  <p className="text-slate-300"><strong>วันเวลา:</strong> {verificationResult.transactionDate || '-'}</p>
                  <p className="text-slate-400 italic mt-1">{verificationResult.summaryNote}</p>

                  <button
                    onClick={() => confirmSlipPayment(
                      selectedPersonForSlip.id,
                      bill.participants.find(p => p.personId === selectedPersonForSlip.id)?.amount || 0
                    )}
                    className="w-full mt-2 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all"
                  >
                    ยืนยันเคลียร์หนี้สำหรับ {selectedPersonForSlip.name} 
                  </button>
                </div>
              )}

              {slipError && (
                <p className="text-xs text-rose-400 bg-rose-950/60 p-2 rounded-xl border border-rose-500/30">
                  ⚠️ {slipError}
                </p>
              )}
            </div>
          )}

          {/* Danger Zone: Delete Bill */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => {
                if (confirm('คุณต้องการลบบิลนี้ใช่หรือไม่?')) {
                  onDeleteBill(bill.id);
                  onClose();
                }
              }}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center space-x-1 font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>ลบบิลนี้</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl"
            >
              ปิดหน้าต่าง
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
