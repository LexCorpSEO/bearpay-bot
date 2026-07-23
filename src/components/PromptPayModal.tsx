import React, { useState } from 'react';
import { PromptPayConfig } from '../types';
import { CreditCard, QrCode, X, Check } from 'lucide-react';
import { getPromptPayQRImageUrl } from '../utils/promptpay';

interface PromptPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: PromptPayConfig;
  onSaveConfig: (config: PromptPayConfig) => void;
}

export const PromptPayModal: React.FC<PromptPayModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  if (!isOpen) return null;

  const [type, setType] = useState<'PHONE' | 'NATIONAL_ID'>(config.type || 'PHONE');
  const [target, setTarget] = useState(config.target || '');
  const [name, setName] = useState(config.name || '');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!target.trim()) {
      alert('กรุณากรอกเบอร์โทรศัพท์ หรือ เลขบัตรประชาชนพร้อมเพย์');
      return;
    }
    onSaveConfig({
      type,
      target: target.trim(),
      name: name.trim() || 'ตัวฉัน (ผู้รับเงิน)',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start  justify-center p-2  bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl my-auto max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">ตั้งค่า PromptPay</h2>
              <p className="text-xs text-slate-400">สร้าง QR อัตโนมัติเวลาทวงเงิน</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4  space-y-4 overflow-y-auto flex-1 min-h-0">
          
          {/* Type Selector */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">ประเภทพร้อมเพย์</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('PHONE')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  type === 'PHONE'
                    ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                📱 เบอร์โทรศัพท์ (10 หลัก)
              </button>
              <button
                type="button"
                onClick={() => setType('NATIONAL_ID')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  type === 'NATIONAL_ID'
                    ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                🪪 เลขบัตรประชาชน (13 หลัก)
              </button>
            </div>
          </div>

          {/* Target Number */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">
              {type === 'PHONE' ? 'หมายเลขโทรศัพท์พร้อมเพย์ *' : 'เลขประจำตัวประชาชน *'}
            </label>
            <input
              type="text"
              placeholder={type === 'PHONE' ? 'เช่น 0812345678' : 'เช่น 1100100123456'}
              value={target}
              onChange={e => setTarget(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none font-mono"
            />
          </div>

          {/* Account Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">ชื่อบัญชีรับเงิน (แสดงกำกับในแอป)</label>
            <input
              type="text"
              placeholder="เช่น นายหมีเปย์ มีสุข"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none"
            />
          </div>

          {/* Live Preview QR */}
          {target && (
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center space-y-2">
              <span className="text-[11px] text-slate-400 block">ตัวอย่าง QR Code พร้อมเพย์รับเงิน:</span>
              <div className="bg-white p-2 rounded-xl w-32 h-32 mx-auto shadow-sm">
                <img
                  src={getPromptPayQRImageUrl(target, 100)}
                  alt="QR Preview"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold shadow-lg shadow-teal-500/20 active:scale-95 transition-all"
            >
              บันทึกข้อมูลพร้อมเพย์
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
