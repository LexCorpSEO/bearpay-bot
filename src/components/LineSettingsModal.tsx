import React, { useState } from 'react';
import { LineConfig, LineNotificationLog } from '../types';
import { Bell, CheckCircle2, AlertTriangle, ExternalLink, Send, ShieldCheck, History, Key, Loader2, X } from 'lucide-react';

interface LineSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: LineConfig;
  onSaveConfig: (config: LineConfig) => void;
  logs: LineNotificationLog[];
}

export const LineSettingsModal: React.FC<LineSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  logs,
}) => {
  if (!isOpen) return null;

  const [token, setToken] = useState(config.notifyToken || '');
  const [enabledAutoReminder, setEnabledAutoReminder] = useState(config.enabledAutoReminder);
  const [reminderHour, setReminderHour] = useState(config.reminderHour || 9);
  const [appUrl, setAppUrl] = useState(config.appUrl || 'https://www.bearpay-app.com');

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; simulated?: boolean } | null>(null);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/line/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token.trim(),
          message: '\n🐻 [BearPay (หมีเปย์)]\nทดสอบระบบแจ้งเตือนผ่าน LINE Notify สำเร็จเรียบร้อยแล้ว!',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTestResult({
          success: true,
          simulated: data.simulated,
          message: data.simulated
            ? 'ส่งข้อความจำลองสำเร็จ (ยังไม่ได้ใส่ Token จริง)'
            : 'ส่งข้อความทดสอบไปยัง LINE ของคุณสำเร็จเรียบร้อย! 🥳',
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'ไม่สามารถส่งข้อความได้ กรุณาตรวจสอบ Token',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      notifyToken: token.trim(),
      enabledAutoReminder,
      reminderHour,
      appUrl: appUrl.trim() || 'https://www.bearpay-app.com',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start  justify-center p-2  bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl my-auto max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4  border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">ตั้งค่า LINE Notify</h2>
              <p className="text-xs text-slate-400">ส่งแจ้งเตือนบิลต่างๆ</p>
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
        <form onSubmit={handleSave} className="p-4  space-y-5 overflow-y-auto flex-1 min-h-0">
          
          {/* Guide Banner */}
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 text-xs space-y-2">
            <div className="font-bold text-emerald-300 flex items-center space-x-1.5">
              <Key className="w-4 h-4 text-emerald-400" />
              <span>วิธีรับ LINE Notify Token ฟรีง่ายๆ ใน 1 นาที:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-300">
              <li>เปิดเว็บไซต์ <a href="https://notify-bot.line.me/" target="_blank" rel="noreferrer" className="text-emerald-400 underline font-semibold">notify-bot.line.me <ExternalLink className="w-3 h-3 inline" /></a></li>
              <li>เข้าสู่ระบบด้วยบัญชี LINE แล้วกดเลือก <strong>"Generate token"</strong></li>
              <li>ตั้งชื่อการแจ้งเตือน เช่น <span className="text-emerald-300">"BearPay ทวงหนี้"</span> และเลือกแชทที่ต้องการรับการแจ้งเตือน</li>
              <li>คัดลอก Token มาวางในช่องด้านล่างนี้</li>
            </ol>
            <p className="text-[11px] text-slate-400 italic">
              *หากยังไม่ได้วาง Token ระบบจะจำลองการส่งแจ้งเตือนและให้กดคัดลอกข้อความทวงหนี้ไปส่งใน LINE แชทได้ทันที
            </p>
          </div>

          {/* Token Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">LINE Notify Personal Token</label>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="วาง LINE Notify Token ของคุณที่นี่..."
                value={token}
                onChange={e => setToken(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs rounded-xl flex items-center space-x-1 border border-slate-700 transition-all disabled:opacity-50"
              >
                {isTesting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>ทดสอบ</span>
              </button>
            </div>
          </div>

          {/* App URL Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>🌐 App URL (ลิงก์ประจำแอป BearPay)</span>
              <span className="text-[11px] text-emerald-400 font-normal">ใช้แนบในข้อความทวงหนี้ผ่าน LINE</span>
            </label>
            <input
              type="text"
              placeholder="https://www.bearpay-app.com"
              value={appUrl}
              onChange={e => setAppUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 outline-none font-mono"
            />
          </div>

          {/* Test Connection Result */}
          {testResult && (
            <div className={`p-3 rounded-xl border text-xs ${
              testResult.success
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
            }`}>
              {testResult.message}
            </div>
          )}

          {/* Auto Reminder Toggle */}
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200">เปิดระบบแจ้งเตือนอัตโนมัติเมื่อถึงวันชำระ</span>
                <p className="text-[11px] text-slate-400 mt-0.5">แจ้งเตือนบิลที่ถึงกำหนดหรือเกินกำหนดชำระเงินทุกวัน</p>
              </div>
              <input
                type="checkbox"
                checked={enabledAutoReminder}
                onChange={e => setEnabledAutoReminder(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            {enabledAutoReminder && (
              <div className="flex items-center space-x-2 pt-2 border-t border-slate-800">
                <span className="text-xs text-slate-300">เวลาแจ้งเตือนประจำวัน:</span>
                <select
                  value={reminderHour}
                  onChange={e => setReminderHour(parseInt(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-emerald-400 font-bold outline-none"
                >
                  <option value={8}>08:00 น. (เช้า)</option>
                  <option value={9}>09:00 น. (สาย)</option>
                  <option value={12}>12:00 น. (เที่ยง)</option>
                  <option value={18}>18:00 น. (เย็น)</option>
                  <option value={20}>20:00 น. (ค่ำ)</option>
                </select>
              </div>
            )}
          </div>

          {/* Notification History Logs */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
              <History className="w-3.5 h-3.5" />
              <span>ประวัติการส่งแจ้งเตือนล่าสุด ({logs.length})</span>
            </h3>

            {logs.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">ยังไม่มีประวัติการส่งแจ้งเตือน</p>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {logs.slice(0, 10).map(log => (
                  <div key={log.id} className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-[11px] flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-200">{log.recipientName}</span>
                      <span className="text-slate-400"> - {log.billTitle}</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
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
              บันทึกการตั้งค่า LINE
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
