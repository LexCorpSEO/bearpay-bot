import React, { useState, useRef } from 'react';
import { X, Camera, Upload, CheckCircle, Loader2, Image as ImageIcon, Plus } from 'lucide-react';
import { BearTransaction } from '../types';
import { formatTHB } from '../utils/thaiFormatters';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from './BearTrackerModal';
import { compressImageForAI } from '../utils/imageCompressor';

interface NewBearTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (transaction: Omit<BearTransaction, 'id' | 'createdAt'>) => void;
}

export function NewBearTransactionModal({ isOpen, onClose, onAddTransaction }: NewBearTransactionModalProps) {
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [amount, setAmount] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>(EXPENSE_CATEGORIES[0].name);
  const [selectedCategoryIcon, setSelectedCategoryIcon] = useState<string>(EXPENSE_CATEGORIES[0].icon);
  const [bearMood, setBearMood] = useState<string>(EXPENSE_CATEGORIES[0].mood);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState<string>('');

  const [isScanningSlip, setIsScanningSlip] = useState<boolean>(false);
  const [scanSuccessMsg, setScanSuccessMsg] = useState<string | null>(null);
  const [attachedSlipUrl, setAttachedSlipUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const mapAiCategoryToBearCategory = (aiCat: string, defaultType: 'EXPENSE' | 'INCOME') => {
    if (defaultType === 'INCOME') return 'เงินเดือน / ค่าจ้าง';
    const catUpper = (aiCat || '').toUpperCase();
    if (catUpper.includes('FOOD') || catUpper.includes('อาหาร') || catUpper.includes('กิน')) return 'อาหาร / เครื่องดื่ม / คาเฟ่';
    if (catUpper.includes('TRAVEL') || catUpper.includes('เดินทาง') || catUpper.includes('น้ำมัน')) return 'การเดินทาง / น้ำมัน / ทางด่วน';
    if (catUpper.includes('SHOPPING') || catUpper.includes('ช้อป')) return 'ช้อปปิ้ง / ของใช้ในบ้าน';
    if (catUpper.includes('RENT') || catUpper.includes('UTILITIES') || catUpper.includes('บ้าน')) return 'ที่พัก / ค่าน้ำ / ค่าไฟ';
    if (catUpper.includes('ENTERTAINMENT') || catUpper.includes('บันเทิง')) return 'ความบันเทิง / สตรีมมิ่ง';
    return 'อื่นๆ / เบ็ดเตล็ด';
  };

  const handleScanSlipOrReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningSlip(true);
    setScanSuccessMsg(null);

    try {
      const compressed = await compressImageForAI(file, 1200, 0.82);
      setAttachedSlipUrl(compressed.dataUrl);

      let res = await fetch('/api/gemini/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: compressed.base64Data,
          mimeType: compressed.mimeType
        })
      });

      let json = await res.json();

      if (!json.success || !json.data || !json.data.totalAmount) {
        res = await fetch('/api/gemini/scan-slip', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: compressed.base64Data,
            mimeType: compressed.mimeType
          })
        });
        json = await res.json();
        if (json.success && json.data) {
          const data = json.data;
          if (data.amount) setAmount(data.amount.toString());
          setType('EXPENSE');
          const noteText = data.payerName || data.summaryNote || 'สลิปโอนเงิน';
          setNote(noteText);
          setScanSuccessMsg(`✨ สแกนสลิปโอนเงินสำเร็จ! ยอด ${formatTHB(data.amount || 0)} บาท (${data.summaryNote || ''})`);
          setBearMood('📸 พี่หมีอ่านสลิปแล้วถอดรายละเอียดให้ครบเลยฮะ!');
        } else {
          alert('ไม่สามารถวิเคราะห์สลิปหรือใบเสร็จได้ กรุณากรอกข้อมูลด้วยตนเอง');
        }
      } else {
        const data = json.data;
        if (data.totalAmount) setAmount(data.totalAmount.toString());
        setType('EXPENSE');
        
        let noteText = data.title || 'รายการใบเสร็จ';
        if (data.items && Array.isArray(data.items) && data.items.length > 0) {
          const itemNames = data.items.map((it: any) => it.name).filter(Boolean).join(', ');
          if (itemNames) noteText += ` (${itemNames})`;
        }
        setNote(noteText);

        if (data.date && /^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
          setDate(data.date);
        }

        if (data.category) {
          const mappedCat = mapAiCategoryToBearCategory(data.category, 'EXPENSE');
          const foundCat = EXPENSE_CATEGORIES.find(c => c.name === mappedCat) || EXPENSE_CATEGORIES[0];
          setSelectedCategory(foundCat.name);
          setSelectedCategoryIcon(foundCat.icon);
          setBearMood(foundCat.mood);
        }

        setScanSuccessMsg(`✨ สแกนใบเสร็จสำเร็จ! ร้าน ${data.title || ''} ยอดรวม ${formatTHB(data.totalAmount || 0)}`);
        setBearMood('📸 พี่หมีอ่านใบเสร็จและถอดรายการให้อย่างเรียบร้อยฮะ!');
      }
    } catch (err) {
      console.error('Scan Error:', err);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อ AI สแกนใบเสร็จ');
    } finally {
      setIsScanningSlip(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      alert('กรุณากรอกจำนวนเงินให้ถูกต้อง');
      return;
    }
    
    onAddTransaction({
      personId: 'me',
      type,
      amount: parseFloat(amount),
      category: selectedCategory,
      categoryIcon: selectedCategoryIcon,
      date,
      note,
      bearMood
    });

    setAmount('');
    setNote('');
    setAttachedSlipUrl(null);
    setScanSuccessMsg(null);
    onClose();
  };

  const handleSelectCategory = (catName: string, icon: string, mood: string) => {
    setSelectedCategory(catName);
    setSelectedCategoryIcon(icon);
    setBearMood(mood);
  };

  const activeCategories = type === 'EXPENSE' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <div className="fixed inset-0 z-50 flex items-end  justify-center p-0  bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border-t  border-slate-800 rounded-t-3xl  p-5  w-full max-w-3xl shadow-2xl relative max-h-[90vh] overflow-y-auto pb-safe">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5 sticky top-0 bg-slate-900 z-10">
          <div className="flex items-center space-x-2">
            <Plus className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">จดรายการใหม่ (ส่วนตัว)</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Scanner */}
        <div className="mb-5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-4 relative overflow-hidden group">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-amber-500/20 rounded-full blur-2xl group-hover:bg-amber-500/30 transition-all" />
          <div className="flex flex-col   justify-between gap-3 relative z-10">
            <div>
              <h4 className="font-bold text-amber-400 flex items-center space-x-1.5 text-sm">
                <span>สแกนสลิปด้วย AI</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-md border border-amber-500/30 tracking-wider">✨ AI</span>
              </h4>
              <p className="text-[11px] text-amber-200/70 mt-1 leading-snug">
                แนบสลิป AI จะอ่านข้อมูลอัตโนมัติ
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="flex-1  cursor-pointer px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center space-x-1.5">
                {isScanningSlip ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span>{isScanningSlip ? 'กำลังสแกน...' : 'แนบสลิป/รูป'}</span>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleScanSlipOrReceipt}
                  className="hidden"
                  disabled={isScanningSlip}
                />
              </label>
            </div>
          </div>
          
          {scanSuccessMsg && (
            <div className="mt-3 p-2 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-start space-x-2 animate-fade-in">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{scanSuccessMsg}</span>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => { setType('EXPENSE'); handleSelectCategory(EXPENSE_CATEGORIES[0].name, EXPENSE_CATEGORIES[0].icon, EXPENSE_CATEGORIES[0].mood); }}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all flex justify-center items-center gap-1.5 ${
                type === 'EXPENSE' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className="text-base">💸</span> รายจ่าย
            </button>
            <button
              type="button"
              onClick={() => { setType('INCOME'); handleSelectCategory(INCOME_CATEGORIES[0].name, INCOME_CATEGORIES[0].icon, INCOME_CATEGORIES[0].mood); }}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all flex justify-center items-center gap-1.5 ${
                type === 'INCOME' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <span className="text-base">💰</span> รายรับ
            </button>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-2">
              เลือกหมวดหมู่ ({type === 'EXPENSE' ? 'รายจ่าย' : 'รายรับ'}):
            </label>
            <div className="grid grid-cols-3  gap-2">
              {activeCategories.map((cat) => {
                const isSelected = selectedCategory === cat.name;
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => handleSelectCategory(cat.name, cat.icon, cat.mood)}
                    className={`p-2 rounded-xl text-center border transition-all flex flex-col items-center justify-center space-y-1 ${
                      isSelected
                        ? type === 'EXPENSE'
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold scale-[1.02]'
                          : 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold scale-[1.02]'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xl">{cat.icon}</span>
                    <span className="text-[10px] leading-tight text-center line-clamp-1">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">จำนวนเงิน (บาท)</label>
            <input
              type="number"
              step="any"
              min="0"
              required
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2.5 text-lg font-black text-white outline-none placeholder:text-slate-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">วันที่</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2.5 text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">บันทึกเพิ่มเติม</label>
              <input
                type="text"
                placeholder="เช่น ค่าอาหาร, กาแฟ..."
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600"
              />
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 mb-2 flex items-center space-x-2">
            <span className="text-lg shrink-0">🐻</span>
            <div className="text-xs text-amber-200 flex-1">
              <span className="font-bold text-amber-400">พี่หมีบอกว่า: </span>
              <span className="italic">"{bearMood}"</span>
            </div>
          </div>

          <button
            type="submit"
            className={`w-full py-3.5 rounded-2xl font-bold text-sm text-slate-950 shadow-lg active:scale-95 transition-all flex items-center justify-center space-x-2 ${
              type === 'EXPENSE' ? 'bg-amber-400 hover:bg-amber-300' : 'bg-emerald-400 hover:bg-emerald-300'
            }`}
          >
            <Plus className="w-5 h-5" />
            <span>บันทึกหมีจด</span>
          </button>
        </form>

      </div>
    </div>
  );
}
