import React, { useState, useEffect } from 'react';
import { X, LogOut, CheckCircle2, ShieldCheck, Mail, User, Sparkles } from 'lucide-react';
import { GoogleUser } from '../types';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: GoogleUser | null;
  onLogin: (user: GoogleUser) => void;
  onLogout: () => void;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setEmailInput(currentUser.email);
      setNameInput(currentUser.name);
    } else {
      setEmailInput('lexkrekrit@gmail.com');
      setNameInput('เล็ก (Krekrit)');
    }
  }, [currentUser, isOpen]);

  if (!isOpen) return null;

  const handleSimulatedGoogleLogin = (email: string, name: string) => {
    setIsSubmitting(true);
    setTimeout(() => {
      const googleUser: GoogleUser = {
        id: `google_${Date.now()}`,
        email: email || 'user@gmail.com',
        name: name || 'Google User',
        picture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email || 'google')}`,
      };
      onLogin(googleUser);
      setIsSubmitting(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-md">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Google Authentication</h3>
              <p className="text-xs text-slate-400">เข้าสู่ระบบด้วยบัญชี Google เพื่อใช้งาน BearPay</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {currentUser ? (
            /* Logged In State */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30 flex items-center space-x-3.5">
                <img
                  src={currentUser.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(currentUser.email)}`}
                  alt={currentUser.name}
                  className="w-12 h-12 rounded-full border-2 border-emerald-400 object-cover shadow-md"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-white text-sm truncate">{currentUser.name}</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  </div>
                  <p className="text-xs text-slate-400 truncate">{currentUser.email}</p>
                  <span className="inline-block mt-1 text-[10px] font-bold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    🟢 เชื่อมต่อด้วย Google OAuth เรียบร้อย
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs text-slate-300 space-y-1.5">
                <p className="flex items-center space-x-1.5 font-bold text-amber-300">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>สิทธิ์และข้อมูลของคุณปลอดภัย</span>
                </p>
                <p className="text-slate-400">
                  ระบบซิงค์ชื่อและอีเมล Google เข้าสู่บัญชีตัวแทนการจ่ายเงิน ("ฉัน") ในระบบหารค่าใช้จ่าย BearPay โดยอัตโนมัติ
                </p>
              </div>

              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="w-full flex items-center justify-center space-x-2 py-3 rounded-2xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-bold text-sm transition-all shadow-md"
              >
                <LogOut className="w-4 h-4" />
                <span>ออกจากระบบ Google (Logout)</span>
              </button>
            </div>
          ) : (
            /* Not Logged In State */
            <div className="space-y-5">
              
              {/* Primary Google Login Action Button */}
              <button
                onClick={() => handleSimulatedGoogleLogin(emailInput, nameInput)}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center space-x-3 py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm shadow-xl active:scale-95 transition-all cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                <span>{isSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบด้วย Google'}</span>
              </button>

              {/* Anonymous / Guest Mode Option */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs border border-slate-700/80 transition-all active:scale-95"
                >
                  <span>🕶️ ใช้งานแบบไม่ระบุตัวตน</span>
                </button>
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 text-center text-[11px] text-slate-500 flex items-center justify-between px-5">
          <span>BearPay Security • ปลอดภัย 100% 🐻</span>
          <button
            onClick={onClose}
            className="text-amber-400 font-bold hover:underline"
          >
            ข้ามการเข้าสู่ระบบ &rarr;
          </button>
        </div>

      </div>
    </div>
  );
};
