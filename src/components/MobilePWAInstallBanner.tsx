import React, { useState, useEffect } from 'react';
import { Download, Share2, PlusSquare, X, Check, Smartphone } from 'lucide-react';

export function MobilePWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem('bearpay_pwa_banner_dismissed') === 'true';
  });

  useEffect(() => {
    // Check if already running as standalone PWA
    const isApp = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isApp);

    // Detect iOS
    const ua = window.navigator.userAgent;
    const isIosDevice = /iphone|ipad|ipod/i.test(ua);
    setIsIOS(isIosDevice);

    // Listen for beforeinstallprompt (Android / Chrome)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  if (isStandalone || isDismissed) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      alert('หากต้องการติดตั้งแอป ให้กดเมนูตัวเลือกในเบราว์เซอร์แล้วเลือก "เพิ่มไปยังหน้าจอโฮม" (Add to Home Screen)');
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('bearpay_pwa_banner_dismissed', 'true');
  };

  return (
    <>
      <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border-b border-amber-500/30 px-3 py-2.5  text-amber-200 flex items-center justify-between text-xs  backdrop-blur-md sticky top-0 z-40 shadow-lg">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-amber-500/30 flex items-center justify-center shrink-0 border border-amber-400/40 text-lg shadow-inner">
            🐻
          </div>
          <div className="min-w-0">
            <div className="font-bold text-amber-100 flex items-center gap-1.5 truncate">
              <span>ติดตั้งแอป BearPay บนมือถือ</span>
              <span className="px-1.5 py-0.5 text-[10px] bg-amber-400/20 text-amber-300 rounded-full font-mono border border-amber-400/30">PWA</span>
            </div>
            <p className="text-[11px] text-amber-200/80 truncate">เข้าใช้งานได้เร็วขึ้น สแกนสลิปไวขึ้น 100%</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all active:scale-95 text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ติดตั้งแอป</span>
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 text-amber-300/60 hover:text-amber-200 rounded-lg hover:bg-amber-500/10 transition-colors"
            title="ซ่อนคำแนะนำ"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS Installation Instructions Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-end  justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-6 max-w-sm w-full text-slate-100 shadow-2xl relative">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-200 rounded-full hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-5">
              <div className="w-16 h-16 bg-amber-500/20 border border-amber-500/40 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg">
                📱
              </div>
              <h3 className="text-lg font-bold text-amber-300">ติดตั้งบน iOS (iPhone/iPad)</h3>
              <p className="text-xs text-slate-400 mt-1">ทำตามขั้นตอนง่ายๆ 2 สเต็ปด้านล่าง</p>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              <div className="flex items-start gap-3 p-3 bg-slate-800/80 rounded-2xl border border-slate-700/50">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 border border-amber-500/30">
                  1
                </div>
                <div>
                  <p className="font-semibold text-slate-200 flex items-center gap-1.5">
                    กดปุ่มแชร์ <Share2 className="w-4 h-4 text-amber-400 inline" />
                  </p>
                  <p className="text-slate-400 mt-0.5">กดปุ่มแชร์ที่แถบล่างสุดของ Safari ใน iPhone คุณ</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-800/80 rounded-2xl border border-slate-700/50">
                <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center shrink-0 border border-amber-500/30">
                  2
                </div>
                <div>
                  <p className="font-semibold text-slate-200 flex items-center gap-1.5">
                    เลือก "เพิ่มไปยังหน้าจอโฮม" <PlusSquare className="w-4 h-4 text-amber-400 inline" />
                  </p>
                  <p className="text-slate-400 mt-0.5">เลื่อนเมนูลงมาแล้วกด 'Add to Home Screen'</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-6 w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl shadow-lg transition-all active:scale-95 text-sm flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>เข้าใจแล้ว</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
