import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  CreditCard,
  Users,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  RotateCcw,
  Settings,
  ChevronDown,
  Bot,
  Trophy,
  BookOpen,
  X,
  Sparkles
} from 'lucide-react';
import { LineConfig, PromptPayConfig, GoogleUser } from '../types';

interface HeaderProps {
  lineConfig: LineConfig;
  promptPayConfig: PromptPayConfig;
  overdueCount: number;
  googleUser?: GoogleUser | null;
  onOpenGoogleAuth?: () => void;
  onOpenNewBill: () => void;
  onOpenLineSettings: () => void;
  onOpenPromptPay: () => void;
  onOpenFriendManager: () => void;
  onOpenLineGroupBot?: () => void;
  onOpenMeowTracker?: () => void;
  onOpenSettleDebt?: () => void;
  onClearAllData?: () => void;
  onRestoreDemoData?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  lineConfig,
  promptPayConfig,
  overdueCount,
  googleUser,
  onOpenGoogleAuth,
  onOpenNewBill,
  onOpenLineSettings,
  onOpenPromptPay,
  onOpenFriendManager,
  onOpenLineGroupBot,
  onOpenMeowTracker,
  onOpenSettleDebt,
  onClearAllData,
  onRestoreDemoData,
}) => {
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const isLineConnected = Boolean(lineConfig.notifyToken && lineConfig.notifyToken.length > 10);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close tools dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsToolsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-slate-900/95 backdrop-blur-md text-white sticky top-0 z-30 border-b border-slate-800 shadow-xl">
      <div className="max-w-7xl mx-auto px-4   py-2.5">
        <div className="flex items-center justify-between gap-3">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-emerald-400 flex items-center justify-center text-slate-950 font-black text-lg shadow-md shadow-amber-900/30 transform hover:scale-105 transition-transform cursor-pointer">
              🐻
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-amber-400 via-teal-200 to-emerald-400 bg-clip-text text-transparent">
                  BearPay (หมีเปย์)
                </h1>
              </div>
              <p className="hidden">
                ระบบหารค่าใช้จ่ายกลุ่ม & บันทึกรายรับ-รายจ่าย
              </p>
            </div>
          </div>

          {/* Right Section: Settings Menu & Primary CTA */}
          <div className="flex items-center space-x-2 ">

            {/* Overdue Alert Badge */}
            {overdueCount > 0 && (
              <div
                className="hidden items-center space-x-1 px-2.5 py-1 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-300 text-xs font-bold animate-pulse"
                title={`มีบิลเกินกำหนด ${overdueCount} รายการ`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>{overdueCount} บิลเกินกำหนด</span>
              </div>
            )}

            {/* Settings & Tools Dropdown Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsToolsOpen(!isToolsOpen)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                  isToolsOpen
                    ? 'bg-slate-800 border-amber-500/50 text-amber-300'
                    : 'bg-slate-800 hover:bg-slate-700/90 border-slate-700 text-slate-300'
                }`}
                title="ตั้งค่าระบบ & เครื่องมือเพิ่มเติม"
              >
                {googleUser ? (
                  <img
                    src={googleUser.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(googleUser.email)}`}
                    alt={googleUser.name}
                    className="w-4 h-4 rounded-full object-cover border border-emerald-400"
                  />
                ) : (
                  <Settings className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>
                  {googleUser ? googleUser.name : 'ตั้งค่า'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isToolsOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Tools Dropdown Modal / Popover */}
              {isToolsOpen && (
                <div className="absolute right-0 mt-2 w-72  bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 text-xs animate-fadeIn">
                  <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                    <span className="font-extrabold text-slate-200 flex items-center space-x-1.5">
                      <Settings className="w-4 h-4 text-amber-400" />
                      <span>เครื่องมือ & ตั้งค่าระบบ</span>
                    </span>
                    <button
                      onClick={() => setIsToolsOpen(false)}
                      className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-2 space-y-1 max-h-[80vh] overflow-y-auto">
                    {/* Section 0: Google Authentication / Profile */}
                    <div className="px-2 py-1 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      บัญชีผู้ใช้งาน
                    </div>

                    {onOpenGoogleAuth && (
                      <button
                        onClick={() => {
                          onOpenGoogleAuth();
                          setIsToolsOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all text-left mb-1 ${
                          googleUser
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200 hover:bg-emerald-900/50'
                            : 'bg-white hover:bg-slate-100 text-slate-900 font-extrabold border-white shadow-md'
                        }`}
                      >
                        {googleUser ? (
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <img
                              src={googleUser.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(googleUser.email)}`}
                              alt={googleUser.name}
                              className="w-6 h-6 rounded-full border border-emerald-400 shrink-0"
                            />
                            <div className="truncate">
                              <p className="font-bold text-xs truncate">{googleUser.name}</p>
                              <p className="text-[10px] text-emerald-400/80 truncate">{googleUser.email}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                              <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              />
                              <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              />
                              <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                              />
                              <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                              />
                            </svg>
                            <span className="font-bold text-xs">เข้าสู่ระบบด้วย Google</span>
                          </div>
                        )}
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 shrink-0 ml-1">
                          {googleUser ? 'โปรไฟล์' : 'Login'}
                        </span>
                      </button>
                    )}

                    {/* Section 1: Features & Functions */}
                    <div className="px-2 pt-2 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      ฟังก์ชันการทำงาน
                    </div>

                    {onOpenMeowTracker && (
                      <button
                        onClick={() => {
                          onOpenMeowTracker();
                          setIsToolsOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-200 hover:text-white transition-all text-left"
                      >
                        <span className="flex items-center space-x-2 font-bold text-amber-300">
                          <BookOpen className="w-4 h-4 text-amber-400" />
                          <span>🐻 บันทึกรับ-จ่าย</span>
                        </span>
                        <span className="text-[10px] text-slate-500">หมีจด</span>
                      </button>
                    )}

                    {onOpenSettleDebt && (
                      <button
                        onClick={() => {
                          onOpenSettleDebt();
                          setIsToolsOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-200 hover:text-white transition-all text-left"
                      >
                        <span className="flex items-center space-x-2 font-bold text-emerald-300">
                          <Trophy className="w-4 h-4 text-emerald-400" />
                          <span>🏆 เคลียร์บัญชี</span>
                        </span>
                        <span className="text-[10px] text-slate-500">Settlement</span>
                      </button>
                    )}

                    {onOpenLineGroupBot && (
                      <button
                        onClick={() => {
                          onOpenLineGroupBot();
                          setIsToolsOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-200 hover:text-white transition-all text-left"
                      >
                        <span className="flex items-center space-x-2 font-bold text-teal-300">
                          <Bot className="w-4 h-4 text-teal-400" />
                          <span>🤖 บอท BearPay กลุ่ม LINE</span>
                        </span>
                        <span className="text-[10px] text-teal-400 font-bold">Bot</span>
                      </button>
                    )}

                    {/* Section 2: Integrations & People */}
                    <div className="px-2 pt-2.5 pb-1 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      การเชื่อมต่อ & บัญชี
                    </div>

                    <button
                      onClick={() => {
                        onOpenLineSettings();
                        setIsToolsOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-200 hover:text-white transition-all text-left"
                    >
                      <span className="flex items-center space-x-2 font-bold">
                        <Bell className="w-4 h-4 text-emerald-400" />
                        <span>แจ้งเตือนผ่าน LINE Notify</span>
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isLineConnected ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'}`}>
                        {isLineConnected ? 'เชื่อมต่อแล้ว' : 'ยังไม่ใส่ Token'}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        onOpenPromptPay();
                        setIsToolsOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-200 hover:text-white transition-all text-left"
                    >
                      <span className="flex items-center space-x-2 font-bold">
                        <CreditCard className="w-4 h-4 text-teal-400" />
                        <span>ตั้งค่าพร้อมเพย์</span>
                      </span>
                      <span className="text-[10px] text-slate-400 truncate max-w-[90px]">
                        {promptPayConfig.target || 'ยังไม่ระบุ'}
                      </span>
                    </button>

                    <button
                      onClick={() => {
                        onOpenFriendManager();
                        setIsToolsOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 text-slate-200 hover:text-white transition-all text-left"
                    >
                      <span className="flex items-center space-x-2 font-bold">
                        <Users className="w-4 h-4 text-sky-400" />
                        <span>จัดการเพื่อนในแก๊ง</span>
                      </span>
                      <span className="text-[10px] text-slate-500">สมาชิกกลุ่ม</span>
                    </button>

                    {/* Section 3: Data Management */}
                    <div className="px-2 pt-2.5 pb-1 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                      จัดการข้อมูล
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                      {onRestoreDemoData && (
                        <button
                          onClick={() => {
                            onRestoreDemoData();
                            setIsToolsOpen(false);
                          }}
                          className="flex items-center justify-center space-x-1 px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-all text-[11px]"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                          <span>โหลดตัวอย่าง</span>
                        </button>
                      )}

                      {onClearAllData && (
                        <button
                          onClick={() => {
                            onClearAllData();
                            setIsToolsOpen(false);
                          }}
                          className="flex items-center justify-center space-x-1 px-2.5 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-500/30 text-rose-300 font-bold transition-all text-[11px]"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                          <span>เคลียร์ข้อมูล</span>
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              )}
            </div>

            {/* Primary Action Button: + หารค่าใช้จ่าย (Hidden on mobile, uses FAB in BottomNav) */}
            <button
              onClick={onOpenNewBill}
              className="hidden items-center space-x-1.5 px-3.5 py-1.5   rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs  shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>หารค่าใช้จ่าย</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};

