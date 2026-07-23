import React, { useState } from 'react';
import { Person, Bill } from '../types';
import { Copy, Check, Send, X, ExternalLink, QrCode } from 'lucide-react';
import { formatTHB, formatThaiDate } from '../utils/thaiFormatters';
import { getPromptPayQRImageUrl } from '../utils/promptpay';

interface LineFlexCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageText: string;
  debtorName?: string;
  amount?: number;
  promptPayTarget?: string;
}

export const LineFlexCardModal: React.FC<LineFlexCardModalProps> = ({
  isOpen,
  onClose,
  messageText,
  debtorName,
  amount,
  promptPayTarget,
}) => {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start  justify-center p-2  bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl my-auto max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🐻</span>
            <div>
              <h2 className="text-base font-bold text-white">การ์ดทวงหนี้สไตล์ BearPay (หมีเปย์)</h2>
              <p className="text-xs text-slate-400">คัดลอกข้อความไปส่งในแชท LINE ได้ทันที</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Preview */}
        <div className="p-4  space-y-4 overflow-y-auto flex-1 min-h-0">
          
          {/* Simulated LINE Chat Bubble */}
          <div className="bg-[#8cabd9] p-4 rounded-2xl space-y-2">
            <div className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              📱 ตัวอย่างข้อความใน LINE Chat:
            </div>
            
            <div className="bg-white rounded-2xl p-3.5 text-slate-900 shadow-md text-xs space-y-2 font-sans relative">
              <pre className="whitespace-pre-wrap font-sans font-medium text-xs leading-relaxed text-slate-800">
                {messageText}
              </pre>

              {promptPayTarget && amount && amount > 0 && (
                <div className="pt-2 border-t border-slate-200 text-center bg-slate-50 p-2 rounded-xl mt-2">
                  <span className="text-[10px] text-slate-500 block font-semibold">QR Code สแกนจ่าย:</span>
                  <div className="bg-white p-1 rounded-lg w-28 h-28 mx-auto my-1 shadow-inner border border-slate-200">
                    <img
                      src={getPromptPayQRImageUrl(promptPayTarget, amount)}
                      alt="PromptPay QR"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold">
                    พร้อมเพย์: {promptPayTarget}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-lg ${
              copied
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 active:scale-95'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>คัดลอกข้อความสำเร็จเรียบร้อย!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>คัดลอกข้อความทวงหนี้ไปส่งใน LINE</span>
              </>
            )}
          </button>

          <p className="text-[11px] text-slate-400 text-center">
            คุณสามารถนำข้อความนี้ไปวาง (Paste) ใน LINE กลุ่มเพื่อน หรือ แชทส่วนตัวได้ทันที
          </p>

        </div>

      </div>
    </div>
  );
};
