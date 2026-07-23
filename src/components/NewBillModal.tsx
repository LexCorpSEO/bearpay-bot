import React, { useState } from 'react';
import { Bill, Person, SplitMethod, BillCategory, BillItem, DailyScheduleItem } from '../types';
import { Sparkles, X, Plus, Trash2, Upload, Camera, Calendar, DollarSign, Users, AlertCircle, Loader2, Repeat, CheckCircle2 } from 'lucide-react';
import { formatTHB, formatThaiDate } from '../utils/thaiFormatters';

import { compressImageForAI } from '../utils/imageCompressor';

interface NewBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  people: Person[];
  onSaveBill: (bill: Bill | Bill[]) => void;
}

export const NewBillModal: React.FC<NewBillModalProps> = ({
  isOpen,
  onClose,
  people,
  onSaveBill,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'MANUAL' | 'AI_SCAN'>('MANUAL');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<BillCategory>('FOOD');
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [splitMethod, setSplitMethod] = useState<SplitMethod>('EQUAL');
  const [note, setNote] = useState('');

  // Default due date = today
  const todayIso = new Date().toISOString().split('T')[0];
  const [dueDate, setDueDate] = useState(todayIso);

  // Installment & Daily Breakdown States
  const [installmentCount, setInstallmentCount] = useState<string>('5');
  const [installmentFrequency, setInstallmentFrequency] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY');
  const [installmentAmountType, setInstallmentAmountType] = useState<'TOTAL' | 'PER_ROUND'>('TOTAL');
  const [generateSeparateBills, setGenerateSeparateBills] = useState<boolean>(false);

  // Selected participant IDs (excluding ME if creator is ME, or including chosen participants)
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>(
    people.filter(p => !p.isMe).slice(0, 3).map(p => p.id)
  );

  // Exact custom amounts per participant if splitMethod === 'EXACT'
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});

  // Items if splitMethod === 'ITEMIZED'
  const [items, setItems] = useState<{ id: string; name: string; price: string; personIds: string[] }[]>([
    { id: 'item_1', name: 'รายการที่ 1', price: '', personIds: [] }
  ]);

  // AI Scan states
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [receiptImageBase64, setReceiptImageBase64] = useState<string | null>(null);

  // Quick preset due dates
  const setPresetDueDate = (daysFromNow: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    setDueDate(d.toISOString().split('T')[0]);
  };

  // Toggle participant selection
  const togglePerson = (id: string) => {
    if (selectedPersonIds.includes(id)) {
      setSelectedPersonIds(prev => prev.filter(p => p !== id));
    } else {
      setSelectedPersonIds(prev => [...prev, id]);
    }
  };

  // Calculate daily schedule array for preview
  const countNum = Math.max(1, parseInt(installmentCount) || 1);
  const parsedTotal = parseFloat(totalAmount) || 0;
  const numPeople = selectedPersonIds.length || 1;

  const effectiveTotalPerRound = installmentAmountType === 'PER_ROUND' ? parsedTotal : parsedTotal / countNum;
  const effectiveOverallTotal = installmentAmountType === 'PER_ROUND' ? parsedTotal * countNum : parsedTotal;

  const perPersonTotal = effectiveOverallTotal / numPeople;
  const perPersonPerInstallment = Math.round((effectiveTotalPerRound / numPeople) * 100) / 100;

  const generateDailySchedulePreview = (): DailyScheduleItem[] => {
    const schedule: DailyScheduleItem[] = [];
    const baseDate = new Date(dueDate || todayIso);

    for (let i = 1; i <= countNum; i++) {
      const d = new Date(baseDate);
      if (installmentFrequency === 'DAILY') {
        d.setDate(d.getDate() + (i - 1));
      } else if (installmentFrequency === 'WEEKLY') {
        d.setDate(d.getDate() + (i - 1) * 7);
      } else if (installmentFrequency === 'MONTHLY') {
        d.setMonth(d.getMonth() + (i - 1));
      }

      schedule.push({
        dayIndex: i,
        date: d.toISOString().split('T')[0],
        amount: perPersonPerInstallment,
        isPaid: false,
      });
    }
    return schedule;
  };

  // AI Scan Handler
  const handleReceiptImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setScanError(null);

    try {
      const compressed = await compressImageForAI(file, 1200, 0.82);
      setReceiptImageBase64(compressed.dataUrl);

      const res = await fetch('/api/gemini/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: compressed.base64Data,
          mimeType: compressed.mimeType,
        }),
      });

      const result = await res.json();

      if (result.success && result.data) {
        const { title: scTitle, totalAmount: scTotal, category: scCat, items: scItems } = result.data;
        if (scTitle) setTitle(scTitle);
        if (scTotal) setTotalAmount(scTotal.toString());
        if (scCat) setCategory(scCat as BillCategory);

        if (scItems && Array.isArray(scItems) && scItems.length > 0) {
          setItems(scItems.map((it: any, idx: number) => ({
            id: 'sc_item_' + idx,
            name: it.name || `รายการที่ ${idx + 1}`,
            price: (it.price || 0).toString(),
            personIds: [],
          })));
          setSplitMethod('ITEMIZED');
        }

        setActiveTab('MANUAL'); // Switch to manual tab for review
      } else {
        setScanError(result.error || 'ไม่สามารถสแกนใบเสร็จได้');
      }
    } catch (err: any) {
      setScanError('เกิดข้อผิดพลาดในการอ่านรูปภาพ');
    } finally {
      setIsScanning(false);
    }
  };

  // Save Bill Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('กรุณากรอกชื่อรายการ/ชื่อบิล');
      return;
    }
    if (parsedTotal <= 0 && splitMethod !== 'ITEMIZED') {
      alert('กรุณากรอกจำนวนเงินรวม');
      return;
    }
    if (selectedPersonIds.length === 0) {
      alert('กรุณาเลือกเพื่อนที่จะหารอย่างน้อย 1 คน');
      return;
    }

    // Handle INSTALLMENT Split Method
    if (splitMethod === 'INSTALLMENT') {
      const dailySched = generateDailySchedulePreview();

      if (generateSeparateBills) {
        // Generate N individual daily bills!
        const createdBills: Bill[] = dailySched.map((schedItem) => ({
          id: `bill_${Date.now()}_${schedItem.dayIndex}`,
          title: `${title.trim()} (${installmentFrequency === 'DAILY' ? `วันที่ ${schedItem.dayIndex}/${countNum}` : `งวดที่ ${schedItem.dayIndex}/${countNum}`})`,
          category,
          creatorId: 'me',
          totalAmount: Math.round(effectiveTotalPerRound * 100) / 100,
          createdAt: todayIso,
          dueDate: schedItem.date,
          splitMethod: 'INSTALLMENT',
          participants: selectedPersonIds.map(personId => ({
            personId,
            amount: schedItem.amount,
            status: 'UNPAID',
          })),
          note: `${note ? note.trim() + ' | ' : ''}ผ่อนชำระ${installmentFrequency === 'DAILY' ? 'วันต่อวัน' : installmentFrequency === 'WEEKLY' ? 'รายสัปดาห์' : 'รายเดือน'} (${schedItem.dayIndex}/${countNum})`,
          receiptImageUrl: receiptImageBase64 || undefined,
          isCompleted: false,
          installmentConfig: {
            isInstallment: true,
            totalInstallments: countNum,
            frequency: installmentFrequency,
            installmentAmountPerPerson: schedItem.amount,
            dailySchedule: [schedItem],
          },
        }));

        onSaveBill(createdBills);
        onClose();
        return;
      } else {
        // Create 1 Master Bill with Daily Schedule table
        const masterBill: Bill = {
          id: 'bill_' + Date.now(),
          title: `${title.trim()} (ผ่อน ${countNum} ${installmentFrequency === 'DAILY' ? 'วัน' : installmentFrequency === 'WEEKLY' ? 'สัปดาห์' : 'งวด'})`,
          category,
          creatorId: 'me',
          totalAmount: effectiveOverallTotal,
          createdAt: todayIso,
          dueDate: dailySched[0]?.date || dueDate,
          splitMethod: 'INSTALLMENT',
          participants: selectedPersonIds.map(personId => ({
            personId,
            amount: perPersonPerInstallment, // Show per-installment amount on card
            status: 'UNPAID',
          })),
          note: note.trim(),
          receiptImageUrl: receiptImageBase64 || undefined,
          isCompleted: false,
          installmentConfig: {
            isInstallment: true,
            totalInstallments: countNum,
            frequency: installmentFrequency,
            installmentAmountPerPerson: perPersonPerInstallment,
            dailySchedule: dailySched,
          },
        };

        onSaveBill(masterBill);
        onClose();
        return;
      }
    }

    // Standard split methods (EQUAL, EXACT, ITEMIZED)
    let participants: { personId: string; amount: number; status: 'UNPAID' }[] = [];

    if (splitMethod === 'EQUAL') {
      const perPerson = Math.round((parsedTotal / selectedPersonIds.length) * 100) / 100;
      participants = selectedPersonIds.map(personId => ({
        personId,
        amount: perPerson,
        status: 'UNPAID',
      }));
    } else if (splitMethod === 'EXACT') {
      participants = selectedPersonIds.map(personId => ({
        personId,
        amount: parseFloat(customAmounts[personId] || '0') || 0,
        status: 'UNPAID',
      }));
    } else if (splitMethod === 'ITEMIZED') {
      const personTotals: Record<string, number> = {};
      selectedPersonIds.forEach(p => (personTotals[p] = 0));

      items.forEach(item => {
        const itemPrice = parseFloat(item.price) || 0;
        const assignees = item.personIds.length > 0 ? item.personIds : selectedPersonIds;
        const splitPrice = itemPrice / assignees.length;

        assignees.forEach(pId => {
          if (personTotals[pId] !== undefined) {
            personTotals[pId] += splitPrice;
          }
        });
      });

      participants = selectedPersonIds.map(personId => ({
        personId,
        amount: Math.round((personTotals[personId] || 0) * 100) / 100,
        status: 'UNPAID',
      }));
    }

    const calculatedTotal = splitMethod === 'ITEMIZED' 
      ? items.reduce((sum, i) => sum + (parseFloat(i.price) || 0), 0)
      : parsedTotal;

    const newBill: Bill = {
      id: 'bill_' + Date.now(),
      title: title.trim(),
      category,
      creatorId: 'me',
      totalAmount: calculatedTotal,
      createdAt: todayIso,
      dueDate,
      splitMethod,
      participants,
      note: note.trim(),
      receiptImageUrl: receiptImageBase64 || undefined,
      isCompleted: false,
    };

    onSaveBill(newBill);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start  justify-center p-2  bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl my-auto max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4  border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">
              🐥
            </div>
            <div>
              <h2 className="text-base font-bold text-white">สร้างบิลใหม่</h2>
              <p className="text-xs text-slate-400">คำนวณยอดหาร</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-950 shrink-0">
          <button
            onClick={() => setActiveTab('MANUAL')}
            className={`flex-1 py-2.5 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'MANUAL'
                ? 'border-emerald-500 text-emerald-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            📝 กรอกข้อมูลเอง
          </button>
          <button
            onClick={() => setActiveTab('AI_SCAN')}
            className={`flex-1 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center justify-center space-x-1.5 ${
              activeTab === 'AI_SCAN'
                ? 'border-emerald-500 text-emerald-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>สแกนใบเสร็จด้วย AI</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4  space-y-5 overflow-y-auto flex-1 min-h-0">
          
          {/* AI Scan Tab View */}
          {activeTab === 'AI_SCAN' && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">สแกนใบเสร็จอัตโนมัติด้วย AI</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-3xl mx-auto">
                  อัปโหลดรูปใบเสร็จอาหาร ค่าทริป หรือค่าบริการ Gemini AI จะอ่านชื่อร้าน รายการอาหาร และยอดเงินรวมให้อัตโนมัติ!
                </p>
              </div>

              {receiptImageBase64 && (
                <div className="relative w-36 h-36 mx-auto rounded-xl overflow-hidden border border-slate-700 shadow-md">
                  <img src={receiptImageBase64} alt="Receipt" className="w-full h-full object-cover" />
                </div>
              )}

              {isScanning ? (
                <div className="flex flex-col items-center justify-center space-y-2 py-4">
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                  <span className="text-xs text-emerald-300 font-semibold">กำลังวิเคราะห์ใบเสร็จด้วย Gemini AI...</span>
                </div>
              ) : (
                <label className="inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer shadow-lg shadow-emerald-500/20 transition-all">
                  <Camera className="w-4 h-4" />
                  <span>{receiptImageBase64 ? 'เปลี่ยนรูปภาพใบเสร็จ' : 'เลือกรูปภาพใบเสร็จ / ถ่ายรูป'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleReceiptImageUpload}
                    className="hidden"
                  />
                </label>
              )}

              {scanError && (
                <p className="text-xs text-rose-400 bg-rose-950/60 p-2.5 rounded-xl border border-rose-500/30">
                  ⚠️ {scanError}
                </p>
              )}
            </div>
          )}

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Title & Category */}
            <div className="grid grid-cols-1  gap-3">
              <div className=" space-y-1">
                <label className="text-xs font-semibold text-slate-300">ชื่อรายการ / ชื่อบิล *</label>
                <input
                  type="text"
                  placeholder="เช่น ชาบูสุกี้จินดา, ค่าทริปพัทยา"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">หมวดหมู่</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as BillCategory)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                >
                  <option value="FOOD">🍔 อาหาร/เครื่องดื่ม</option>
                  <option value="TRAVEL">✈️ ท่องเที่ยว/ที่พัก</option>
                  <option value="RENT">🏠 ค่าเช่า/ที่อยู่อาศัย</option>
                  <option value="UTILITIES">⚡ ค่าน้ำ/ค่าไฟ/เน็ต</option>
                  <option value="SHOPPING">🛍️ ช้อปปิ้ง/ซื้อของ</option>
                  <option value="ENTERTAINMENT">🎬 ความบันเทิง/หนัง</option>
                  <option value="OTHER">📦 อื่นๆ</option>
                </select>
              </div>
            </div>

            {/* Total Amount & Due Date */}
            <div className="grid grid-cols-1  gap-3">
              {splitMethod !== 'ITEMIZED' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">จำนวนเงินรวม (บาท) *</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={totalAmount}
                    onChange={e => setTotalAmount(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm font-bold text-emerald-400 placeholder-slate-600 outline-none"
                  />
                </div>
              )}

              <div className="space-y-1 ">
                <label className="text-xs font-semibold text-slate-300">วันกำหนดชำระเงิน *</label>
                <div className="flex space-x-1 mb-1">
                  <button
                    type="button"
                    onClick={() => setPresetDueDate(0)}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 rounded-md"
                  >
                    วันนี้
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetDueDate(3)}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 rounded-md"
                  >
                    +3 วัน
                  </button>
                  <button
                    type="button"
                    onClick={() => setPresetDueDate(7)}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 rounded-md"
                  >
                    +7 วัน
                  </button>
                </div>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>
            </div>

            {/* Split Method Selector */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold text-slate-300">รูปแบบการหาร</label>
              <div className="grid grid-cols-2  gap-2">
                <button
                  type="button"
                  onClick={() => setSplitMethod('EQUAL')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    splitMethod === 'EQUAL'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs">⚖️ หารเท่ากัน</div>
                  <div className="text-[10px] opacity-75">แบ่งเท่าๆ กันทุกคน</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSplitMethod('EXACT')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    splitMethod === 'EXACT'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs">🔢 ระบุยอด</div>
                  <div className="text-[10px] opacity-75">กำหนดจำนวนเอง</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSplitMethod('ITEMIZED')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    splitMethod === 'ITEMIZED'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs">📜 ตามรายการ</div>
                  <div className="text-[10px] opacity-75">สั่งอะไร จ่ายอันนั้น</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSplitMethod('INSTALLMENT')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    splitMethod === 'INSTALLMENT'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs">📅 ผ่อนชำระ</div>
                  <div className="text-[10px] opacity-75">แยกวันต่อวัน/งวด</div>
                </button>
              </div>
            </div>

            {/* Installment Options Box when INSTALLMENT is selected */}
            {splitMethod === 'INSTALLMENT' && (
              <div className="bg-slate-950/80 border border-emerald-500/30 rounded-2xl p-4 space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
                  <Repeat className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-emerald-400">การตั้งค่าแจ้งหนี้แบบผ่อนชำระ (แยกวันต่อวัน)</h4>
                </div>

                {/* Frequency Selection */}
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-300">รอบการชำระเงิน</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setInstallmentFrequency('DAILY')}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                        installmentFrequency === 'DAILY'
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      📅 แยกวันต่อวัน (ทุกวัน)
                    </button>
                    <button
                      type="button"
                      onClick={() => setInstallmentFrequency('WEEKLY')}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                        installmentFrequency === 'WEEKLY'
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      🗓️ รายสัปดาห์ (7 วัน)
                    </button>
                    <button
                      type="button"
                      onClick={() => setInstallmentFrequency('MONTHLY')}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                        installmentFrequency === 'MONTHLY'
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      📆 รายเดือน
                    </button>
                  </div>
                </div>

                {/* Amount Type */}
                <div className="space-y-1 pt-1">
                  <label className="text-[11px] font-medium text-slate-300">รูปแบบยอดเงิน (Amount Type)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setInstallmentAmountType('TOTAL')}
                      className={`p-2 rounded-xl text-[11px] font-bold border transition-all ${
                        installmentAmountType === 'TOTAL'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      นำยอดรวมทั้งหมดมาหารผ่อน
                    </button>
                    <button
                      type="button"
                      onClick={() => setInstallmentAmountType('PER_ROUND')}
                      className={`p-2 rounded-xl text-[11px] font-bold border transition-all ${
                        installmentAmountType === 'PER_ROUND'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      เก็บตามยอดนี้ทุกรอบ (บิลประจำ)
                    </button>
                  </div>
                </div>

                {/* Installment Count Input & Presets */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-medium text-slate-300">
                      จำนวน{installmentFrequency === 'DAILY' ? 'วัน' : installmentFrequency === 'WEEKLY' ? 'สัปดาห์' : 'งวด'} (ชำระผ่อน)
                    </label>
                    <div className="flex space-x-1">
                      <button
                        type="button"
                        onClick={() => setInstallmentCount('5')}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-[10px] text-emerald-400 font-bold rounded-md"
                      >
                        5 {installmentFrequency === 'DAILY' ? 'วัน' : 'งวด'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setInstallmentCount('10')}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-[10px] text-emerald-400 font-bold rounded-md"
                      >
                        10 {installmentFrequency === 'DAILY' ? 'วัน' : 'งวด'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setInstallmentCount('30')}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-[10px] text-emerald-400 font-bold rounded-md"
                      >
                        30 วัน
                      </button>
                    </div>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={installmentCount}
                    onChange={e => setInstallmentCount(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-1.5 text-xs text-white outline-none font-bold"
                  />
                </div>

                {/* Mode toggle: Generate separate bills or single master bill */}
                <div className="pt-1">
                  <label className="flex items-center space-x-2 cursor-pointer p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all">
                    <input
                      type="checkbox"
                      checked={generateSeparateBills}
                      onChange={e => setGenerateSeparateBills(e.target.checked)}
                      className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-white block">แตกออกเป็นรายการบิลแยกตามวัน/งวดทันที</span>
                      <span className="text-[10px] text-slate-400">
                        {generateSeparateBills
                          ? `ระบบจะสร้างบิลแยกให้ ${countNum} บิล ตามวันที่ติดกันโดยอัตโนมัติ`
                          : 'รวมเป็นบิลเดียว พร้อมตารางแจกแจงการผ่อนชำระวันต่อวัน'}
                      </span>
                    </div>
                  </label>
                </div>

                {/* Calculation Summary Box */}
                {parsedTotal > 0 && selectedPersonIds.length > 0 && (
                  <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>ยอดรวมทั้งสิ้น (ตลอดรายการ):</span>
                      <span className="font-bold text-white">{formatTHB(effectiveOverallTotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>หาร {selectedPersonIds.length} คน (ยอดรวมต่อคน):</span>
                      <span className="font-bold text-emerald-400">{formatTHB(perPersonTotal)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-300 font-bold border-t border-slate-800 pt-1.5">
                      <span>👉 ยอดผ่อนต่อคน / ต่อ{installmentFrequency === 'DAILY' ? 'วัน' : 'งวด'}:</span>
                      <span className="text-sm text-emerald-400 font-black">
                        {formatTHB(perPersonPerInstallment)} / {installmentFrequency === 'DAILY' ? 'วัน' : 'งวด'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Daily Schedule Preview Table */}
                {parsedTotal > 0 && (
                  <div className="space-y-1 pt-1">
                    <label className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                      <span>ตารางแจกแจงวันผ่อนชำระ ({countNum} รายการ):</span>
                      <span className="text-[10px] text-emerald-400">เริ่มวันที่ {formatThaiDate(dueDate)}</span>
                    </label>

                    <div className="max-h-36 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                      {generateDailySchedulePreview().map((item) => (
                        <div
                          key={item.dayIndex}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px]"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold text-[10px]">
                              {installmentFrequency === 'DAILY' ? `วันที่ ${item.dayIndex}` : `งวด ${item.dayIndex}`}
                            </span>
                            <span className="text-slate-200 font-medium">{formatThaiDate(item.date)}</span>
                          </div>
                          <span className="font-bold text-emerald-400">
                            {formatTHB(item.amount)} / คน
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Participant Selection */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>เพื่อนที่มีส่วนร่วมในการหาร ({selectedPersonIds.length} คน)</span>
              </label>

              <div className="grid grid-cols-2  gap-2">
                {people.filter(p => !p.isMe).map(person => {
                  const isSelected = selectedPersonIds.includes(person.id);
                  return (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => togglePerson(person.id)}
                      className={`flex items-center space-x-2 p-2 rounded-xl border text-left text-xs transition-all ${
                        isSelected
                          ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-200'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-lg ${person.avatarColor} text-white font-bold text-[10px] flex items-center justify-center`}>
                        {person.name.charAt(0)}
                      </div>
                      <span className="truncate font-medium">{person.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Exact Amount Inputs */}
            {splitMethod === 'EXACT' && selectedPersonIds.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="text-xs font-semibold text-slate-300">ระบุยอดเงินสำหรับเพื่อนแต่ละคน</label>
                <div className="space-y-2">
                  {selectedPersonIds.map(pId => {
                    const person = people.find(p => p.id === pId);
                    return (
                      <div key={pId} className="flex items-center justify-between bg-slate-950 p-2 rounded-xl border border-slate-800">
                        <span className="text-xs text-slate-200 font-medium">{person?.name}</span>
                        <input
                          type="number"
                          placeholder="0.00"
                          value={customAmounts[pId] || ''}
                          onChange={e => setCustomAmounts({ ...customAmounts, [pId]: e.target.value })}
                          className="w-32 bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-lg px-2.5 py-1 text-xs text-right text-emerald-400 font-bold outline-none"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Note */}
            <div className="space-y-1 pt-2">
              <label className="text-xs font-semibold text-slate-300">หมายเหตุเพิ่มเติม</label>
              <textarea
                placeholder="เช่น เลขบัญชีรับโอน หรือ บันทึกข้อความ..."
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-500 outline-none resize-none"
              />
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
              >
                บันทึกสร้างบิล 🐥
              </button>
            </div>

          </form>

        </div>

      </div>
    </div>
  );
};
