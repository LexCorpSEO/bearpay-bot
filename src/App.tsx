import React, { useState, useEffect } from 'react';
import { Bill, Person, LineConfig, PromptPayConfig, IndividualSummaryItem, LineNotificationLog, PaymentStatus, BearTransaction, GoogleUser } from './types';
import {
  getNotificationLogs,
  addNotificationLog,
  INITIAL_BILLS,
  INITIAL_PEOPLE,
  INITIAL_LINE_CONFIG,
  INITIAL_PROMPTPAY,
  DEMO_BILLS,
  DEMO_PEOPLE,
  DEMO_PROMPTPAY,
} from './utils/storage';
import { fb } from './fbUtils';
import {
  generateLineReminderMessage,
  generateSummaryLineMessage,
  formatTHB,
  getDaysRemaining,
} from './utils/thaiFormatters';
import { Header } from './components/Header';
import { GoogleAuthModal } from './components/GoogleAuthModal';
import { DashboardCards } from './components/DashboardCards';
import { IndividualSummary } from './components/IndividualSummary';
import { BillList } from './components/BillList';
import { NewBillModal } from './components/NewBillModal';
import { BillDetailModal } from './components/BillDetailModal';
import { LineSettingsModal } from './components/LineSettingsModal';
import { PromptPayModal } from './components/PromptPayModal';
import { FriendManagerModal } from './components/FriendManagerModal';
import { LineFlexCardModal } from './components/LineFlexCardModal';
import { LineGroupBotModal } from './components/LineGroupBotModal';
import { BearTrackerModal } from './components/BearTrackerModal';
import { BearJodInlineView } from './components/BearJodInlineView';
import { SettleDebtModal } from './components/SettleDebtModal';
import { NewBearTransactionModal } from './components/NewBearTransactionModal';
import { MobilePWAInstallBanner } from './components/MobilePWAInstallBanner';
import { MobileBottomNav, MobileTab } from './components/MobileBottomNav';
import { Sparkles, Users, Receipt, Send, Bell } from 'lucide-react';

const INITIAL_BEAR_TRANSACTIONS: BearTransaction[] = [];

const DEMO_BEAR_TRANSACTIONS: BearTransaction[] = [
  {
    id: 'b1',
    personId: 'p_lek',
    type: 'INCOME',
    amount: 35000,
    category: 'เงินเดือน / ค่าจ้าง',
    categoryIcon: '💰',
    date: '2026-07-01',
    note: 'เงินเดือนประจำเดือน (เล็ก)',
    bearMood: '🐻 เงินเดือนออกแล้ว เย้!',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'b2',
    personId: 'p_lek',
    type: 'EXPENSE',
    amount: 2800,
    category: 'อาหาร & เครื่องดื่ม',
    categoryIcon: '🍔',
    date: '2026-07-05',
    note: 'บุฟเฟต์ปิ้งย่างกับเพื่อนๆ',
    bearMood: '🐻 อิ่มพุงกางเลยฮะ~',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'b3',
    personId: 'p_aung',
    type: 'INCOME',
    amount: 28000,
    category: 'เงินเดือน / ค่าจ้าง',
    categoryIcon: '💰',
    date: '2026-07-01',
    note: 'เงินเดือนเอิง',
    bearMood: '🐻 พี่หมีขยันทำงานฮะ',
    createdAt: new Date().toISOString(),
  },
];

export default function App() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [people, setPeople] = useState<Person[]>(INITIAL_PEOPLE);
  const [lineConfig, setLineConfig] = useState<LineConfig>({ notifyToken: '', enabledAutoReminder: true, reminderHour: 9, appUrl: 'https://www.bearpay-app.com' });
  const [promptPayConfig, setPromptPayConfig] = useState<PromptPayConfig>({ type: 'PHONE', target: '', name: '' });
  const [notificationLogs, setNotificationLogs] = useState<LineNotificationLog[]>(getNotificationLogs);

  useEffect(() => {
    const unsubBills = fb.subscribeBills(setBills);
    const unsubPeople = fb.subscribePeople(setPeople);
    const unsubConfig = fb.subscribeConfig((config) => {
      setLineConfig(config.line);
      setPromptPayConfig(config.promptPay);
    });
    return () => {
      unsubBills();
      unsubPeople();
      unsubConfig();
    };
  }, []);

  // Google Authentication State
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(() => {
    try {
      const saved = localStorage.getItem('bearpay_google_user_v1');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [isGoogleAuthOpen, setIsGoogleAuthOpen] = useState(() => {
    // Show Google Auth Popup on initial launch if user is not logged in
    try {
      const savedUser = localStorage.getItem('bearpay_google_user_v1');
      return !savedUser;
    } catch (e) {
      return true;
    }
  });

  // Sync Google user with "me" in people array
  const handleGoogleLogin = (user: GoogleUser) => {
    setGoogleUser(user);
    localStorage.setItem('bearpay_google_user_v1', JSON.stringify(user));

    // Update 'me' user details in people array
    const updatedPeople = people.map(p => {
      if (p.isMe || p.id === 'me') {
        return {
          ...p,
          name: user.name,
          email: user.email,
          avatarUrl: user.picture,
        };
      }
      return p;
    });
    updatedPeople.forEach(p => fb.savePerson(p));

    showToast(`🟢 เข้าสู่ระบบ Google ในชื่อ ${user.name} เรียบร้อยแล้ว ✨`);
  };

  const handleGoogleLogout = () => {
    setGoogleUser(null);
    localStorage.removeItem('bearpay_google_user_v1');
    showToast('🔴 ออกจากระบบ Google เรียบร้อยแล้ว');
  };

  // Global Active Account Selector ('ALL' or personId)
  const [activeAccountId, setActiveAccountId] = useState<string>('me');

  // Main Function Mode Switcher: 'BEAR_PAY' vs 'BEAR_JOD'
  const [mainMode, setMainMode] = useState<'BEAR_PAY' | 'BEAR_JOD'>('BEAR_JOD');

  const [isTripCardDismissed, setIsTripCardDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('bearpay_trip_card_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  const handleDismissTripCard = () => {
    setIsTripCardDismissed(true);
    try {
      localStorage.setItem('bearpay_trip_card_dismissed', 'true');
    } catch (e) {
      console.error(e);
    }
  };

  // Clear all system data handler
  const handleClearAllData = () => {
    if (confirm('⚠️ คุณต้องการเคลียร์ข้อมูลออกทั้งหมดใช่หรือไม่?\n\nการดำเนินการนี้จะลบบิลหารค่าใช้จ่ายทั้งหมด รายการจดบันทึกรายรับ-รายจ่ายทั้งหมด สมาชิกกลุ่ม และประวัติแจ้งเตือน ให้เริ่มต้นเป็น 0')) {
      bills.forEach(b => fb.deleteBill(b.id));
      bearTransactions.forEach(t => fb.deleteBearTransaction(t.id));
      people.forEach(p => { if(!p.isMe) fb.deletePerson(p.id) });
      fb.savePromptPayConfig(INITIAL_PROMPTPAY);
      fb.saveLineConfig(INITIAL_LINE_CONFIG);
      setNotificationLogs([]);
      setIsTripCardDismissed(true);
      localStorage.setItem('khunthong_bear_transactions_v2', JSON.stringify([]));
      localStorage.setItem('khunthong_notification_logs_v1', JSON.stringify([]));
      localStorage.setItem('bearpay_trip_card_dismissed', 'true');
      showToast('🧹 เคลียร์ข้อมูลทั้งหมดเรียบร้อยแล้ว! เริ่มต้นบัญชีสะอาด 0 รายการ ✨');
    }
  };

  // Restore sample demo data handler
  const handleRestoreDemoData = () => {
    if (confirm('คุณต้องการโหลดข้อมูลตัวอย่างสำหรับทดลองใช้งานใช่หรือไม่?')) {
      DEMO_BILLS.forEach(b => fb.saveBill(b));
      DEMO_PEOPLE.forEach(p => fb.savePerson(p));
      DEMO_BEAR_TRANSACTIONS.forEach(t => fb.saveBearTransaction(t));
      fb.savePromptPayConfig(DEMO_PROMPTPAY);
      setIsTripCardDismissed(false);
      localStorage.setItem('khunthong_bear_transactions_v2', JSON.stringify(DEMO_BEAR_TRANSACTIONS));
      localStorage.setItem('bearpay_trip_card_dismissed', 'false');
      showToast('🔄 โหลดข้อมูลตัวอย่างสำเร็จเรียบร้อย ✨');
    }
  };

  // Sub Tab for BearPay Mode: 'INDIVIDUAL' or 'BILLS'
  const [activeTab, setActiveTab] = useState<'INDIVIDUAL' | 'BILLS'>('INDIVIDUAL');

  // Modals
  const [isNewBillOpen, setIsNewBillOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [isLineSettingsOpen, setIsLineSettingsOpen] = useState(false);
  const [isPromptPayOpen, setIsPromptPayOpen] = useState(false);
  const [isFriendManagerOpen, setIsFriendManagerOpen] = useState(false);
  const [isLineGroupBotOpen, setIsLineGroupBotOpen] = useState(false);
  const [isNewBearTransactionOpen, setIsNewBearTransactionOpen] = useState(false);
  const [isSettleDebtOpen, setIsSettleDebtOpen] = useState(false);

  // Bear Transactions state
  const [bearTransactions, setBearTransactions] = useState<BearTransaction[]>([]);

  useEffect(() => {
    const unsub = fb.subscribeBearTransactions(setBearTransactions);
    return () => unsub();
  }, []);

  // Sync with LINE Bot Slips via Background Polling
  useEffect(() => {
    const fetchSlips = async () => {
      try {
        const res = await fetch('/api/slips/recent');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data && data.data.length > 0) {
            const slips = data.data;
            for (const slip of slips) {
              const newTx: BearTransaction = {
                id: 'tx_line_' + slip.id,
                personId: 'me',
                type: 'EXPENSE',
                amount: slip.amount,
                category: 'สลิปจาก LINE',
                categoryIcon: '📱',
                date: new Date(slip.timestamp).toISOString().split('T')[0],
                note: `ผู้รับ: ${slip.receiverName || '-'} | ${slip.summaryNote}`,
                bearMood: '🐻 หมีเปย์บันทึกจากแชทแล้วฮะ!',
                createdAt: new Date(slip.timestamp).toISOString(),
              };
              fb.saveBearTransaction(newTx);
              showToast(`🐻 ซิงค์สลิป ${slip.amount} บาทจาก LINE สำเร็จ!`);
              
              // Clear it from the server
              await fetch('/api/slips/clear', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: slip.id })
              });
            }
          }
        }
      } catch (err) {
        console.error("Error polling LINE slips", err);
      }
    };
    
    // Poll every 5 seconds
    const interval = setInterval(fetchSlips, 5000);
    return () => clearInterval(interval);
  }, []);

  // LINE Flex Card Preview Modal
  const [flexModalData, setFlexModalData] = useState<{
    isOpen: boolean;
    messageText: string;
    debtorName?: string;
    amount?: number;
  }>({
    isOpen: false,
    messageText: '',
  });

  // Toast / Notification status message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  

  // Calculate Overall Dashboard Metrics & Individual Summaries
  let totalOwedToMe = 0;
  let totalIOweThem = 0;
  let overdueBillsCount = 0;
  let pendingSlipsCount = 0;

  const individualSummaries: IndividualSummaryItem[] = people
    .filter(p => !p.isMe)
    .map(person => {
      let owedToMe = 0;
      let iOwe = 0;
      const unpaidBillsList: { bill: Bill; participant: any; isIOweThem: boolean }[] = [];

      bills.forEach(bill => {
        const daysInfo = getDaysRemaining(bill.dueDate);
        if (daysInfo.isOverdue && !bill.isCompleted) {
          // Count overdue bills
        }

        // Case A: I am the creditor, this person is a participant
        if (bill.creatorId === 'me') {
          const participant = bill.participants.find(p => p.personId === person.id);
          if (participant && participant.status !== 'PAID') {
            owedToMe += participant.amount;
            unpaidBillsList.push({ bill, participant, isIOweThem: false });

            if (participant.status === 'PENDING_SLIP') pendingSlipsCount++;
          }
        }

        // Case B: This person is the creator, I am a participant
        if (bill.creatorId === person.id) {
          const participant = bill.participants.find(p => p.personId === 'me');
          if (participant && participant.status !== 'PAID') {
            iOwe += participant.amount;
            unpaidBillsList.push({ bill, participant, isIOweThem: true });
          }
        }
      });

      totalOwedToMe += owedToMe;
      totalIOweThem += iOwe;

      return {
        person,
        totalOwedToMe: owedToMe,
        totalIOweThem: iOwe,
        netBalance: owedToMe - iOwe,
        unpaidBills: unpaidBillsList,
      };
    });

  // Calculate overdue bill count
  overdueBillsCount = bills.filter(b => {
    if (b.isCompleted) return false;
    const daysInfo = getDaysRemaining(b.dueDate);
    const hasUnpaid = b.participants.some(p => p.status !== 'PAID');
    return daysInfo.isOverdue && hasUnpaid;
  }).length;

  const netBalance = totalOwedToMe - totalIOweThem;

  // Handlers
  const handleSaveNewBill = (newBill: Bill | Bill[]) => {
    if (Array.isArray(newBill)) {
      newBill.forEach(b => fb.saveBill(b));
      showToast(`สร้างบิลผ่อนชำระแยกวัน ${newBill.length} รายการสำเร็จเรียบร้อย! 🤝`);
    } else {
      fb.saveBill(newBill);
      showToast(`สร้างบิล "${newBill.title}" สำเร็จเรียบร้อย! 🐥`);
    }
  };

  const handleUpdateParticipantStatus = (
    billId: string,
    personId: string,
    status: PaymentStatus,
    slipUrl?: string,
    notes?: string
  ) => {
    const billToUpdate = bills.find(b => b.id === billId);
    if (billToUpdate) {
      const updatedParticipants = billToUpdate.participants.map(part => {
        if (part.personId !== personId) return part;
        return {
          ...part,
          status,
          paidAt: status === 'PAID' ? new Date().toISOString() : part.paidAt,
          slipUrl: slipUrl || part.slipUrl,
          slipNotes: notes || part.slipNotes,
        };
      });
      const isCompleted = updatedParticipants.every(p => p.status === 'PAID');
      const updatedBill = {
        ...billToUpdate,
        participants: updatedParticipants,
        isCompleted,
      };
      fb.saveBill(updatedBill);
    }

    // Update selected bill state if modal is open
    if (selectedBill && selectedBill.id === billId) {
      setSelectedBill(prev => {
        if (!prev) return null;
        const updatedParts = prev.participants.map(part => {
          if (part.personId !== personId) return part;
          return {
            ...part,
            status,
            paidAt: status === 'PAID' ? new Date().toISOString() : part.paidAt,
            slipUrl: slipUrl || part.slipUrl,
            slipNotes: notes || part.slipNotes,
          };
        });
        return {
          ...prev,
          participants: updatedParts,
          isCompleted: updatedParts.every(p => p.status === 'PAID'),
        };
      });
    }

    showToast(`อัปเดตสถานะการชำระเงินเรียบร้อยแล้ว`);
  };

  const handleDeleteBill = (billId: string) => {
    fb.deleteBill(billId);
    showToast('ลบบิลเรียบร้อยแล้ว');
  };

  // LINE Notification Actions
  const handleSendIndividualLineReminder = async (person: Person, totalOwed: number, unpaidCount: number) => {
    const message = generateSummaryLineMessage(
      person.name,
      'ตัวฉัน',
      totalOwed,
      unpaidCount,
      promptPayConfig.target,
      promptPayConfig.name,
      lineConfig.appUrl || 'https://www.bearpay-app.com'
    );

    if (lineConfig.notifyToken && lineConfig.notifyToken.length > 10) {
      try {
        const res = await fetch('/api/line/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: lineConfig.notifyToken,
            message,
          }),
        });
        const data = await res.json();
        if (data.success) {
          addNotificationLog({
            recipientName: person.name,
            billTitle: 'สรุปยอดคงเหลือรายบุคคล',
            amount: totalOwed,
            status: 'SUCCESS',
            message,
          });
          setNotificationLogs(getNotificationLogs());
          showToast(`ส่งแจ้งเตือน LINE ไปยัง ${person.name} เรียบร้อย! 🚀`);
          return;
        }
      } catch (err) {
        console.error('Line notify failed', err);
      }
    }

    // Fallback or preview modal if no token or simulated
    setFlexModalData({
      isOpen: true,
      messageText: message,
      debtorName: person.name,
      amount: totalOwed,
    });
  };

  const handleSendBillReminder = async (bill: Bill) => {
    const unpaidParts = bill.participants.filter(p => p.status !== 'PAID');
    if (unpaidParts.length === 0) return;

    for (const part of unpaidParts) {
      const person = people.find(p => p.id === part.personId);
      if (!person) continue;

      const message = generateLineReminderMessage(
        person.name,
        'ตัวฉัน',
        bill.title,
        part.amount,
        bill.dueDate,
        promptPayConfig.target,
        promptPayConfig.name,
        lineConfig.appUrl || 'https://www.bearpay-app.com'
      );

      if (lineConfig.notifyToken && lineConfig.notifyToken.length > 10) {
        try {
          await fetch('/api/line/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: lineConfig.notifyToken,
              message,
            }),
          });
          addNotificationLog({
            recipientName: person.name,
            billTitle: bill.title,
            amount: part.amount,
            status: 'SUCCESS',
            message,
          });
        } catch (e) {}
      } else {
        setFlexModalData({
          isOpen: true,
          messageText: message,
          debtorName: person.name,
          amount: part.amount,
        });
        return;
      }
    }

    setNotificationLogs(getNotificationLogs());
    showToast(`ส่งเตือน LINE สำหรับบิล "${bill.title}" สำเร็จแล้ว! 🐥`);
  };

  const handleSendAllReminders = () => {
    const overdueDebtors = individualSummaries.filter(item => item.netBalance > 0);
    if (overdueDebtors.length === 0) {
      showToast('ไม่มีเพื่อนติดหนี้ค้างชำระในขณะนี้ 🎉');
      return;
    }

    overdueDebtors.forEach(item => {
      handleSendIndividualLineReminder(item.person, item.netBalance, item.unpaidBills.length);
    });
  };

  const handleClearPersonDebt = (personId: string) => {
    const person = people.find(p => p.id === personId);
    if (!confirm(`คุณต้องการทำเครื่องหมายว่า "${person?.name}" เคลียร์หนี้ค้างทั้งหมดแล้วใช่หรือไม่?`)) return;

    setBills(prevBills =>
      prevBills.map(bill => {
        if (bill.creatorId !== 'me') return bill;
        const updatedParticipants = bill.participants.map(part => {
          if (part.personId !== personId) return part;
          return { ...part, status: 'PAID' as PaymentStatus, paidAt: new Date().toISOString() };
        });
        return {
          ...bill,
          participants: updatedParticipants,
          isCompleted: updatedParticipants.every(p => p.status === 'PAID'),
        };
      })
    );

    showToast(`เคลียร์หนี้สำหรับ ${person?.name} เรียบร้อยแล้ว ✨`);
  };

  // Bear Handlers
  const handleAddBearTransaction = (item: Omit<BearTransaction, 'id' | 'createdAt'>) => {
    const newTrans: BearTransaction = {
      ...item,
      id: 'bear_' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setBearTransactions(prev => [newTrans, ...prev]);
    showToast(`พี่หมีจดบันทึก "${item.note || item.category}" เรียบร้อยฮะ! 🐻`);
  };

  const handleDeleteBearTransaction = (id: string) => {
    setBearTransactions(prev => prev.filter(t => t.id !== id));
    showToast('ลบรายการหมีจดเรียบร้อย');
  };

  // Settlement Handlers
  const handleSettleFullPersonDebt = (personId: string) => {
    setBills(prev =>
      prev.map(b => {
        let updatedParticipants = b.participants.map(p => {
          if (p.personId === personId && p.status !== 'PAID') {
            return { ...p, status: 'PAID' as PaymentStatus, paidAt: new Date().toISOString() };
          }
          return p;
        });

        const isNowCompleted = updatedParticipants.every(p => p.status === 'PAID');

        return {
          ...b,
          participants: updatedParticipants,
          isCompleted: isNowCompleted,
        };
      })
    );
    showToast('ปิดหนี้และเคลียร์ยอดทั้งหมดเรียบร้อยแล้ว! 🏆');
  };

  const handleSettleBillDebt = (billId: string, personId?: string) => {
    setBills(prev =>
      prev.map(b => {
        if (b.id !== billId) return b;

        let updatedParticipants = b.participants.map(p => {
          if (!personId || p.personId === personId) {
            return { ...p, status: 'PAID' as PaymentStatus, paidAt: new Date().toISOString() };
          }
          return p;
        });

        const isNowCompleted = updatedParticipants.every(p => p.status === 'PAID');

        return {
          ...b,
          participants: updatedParticipants,
          isCompleted: isNowCompleted,
        };
      })
    );
    showToast('ปิดบิลเรียบร้อยแล้ว! ✨');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-slate-950 pb-16">
      
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-500 text-slate-950 px-4 py-2.5 rounded-2xl font-bold text-xs shadow-2xl flex items-center space-x-2 animate-bounce">
          <Sparkles className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* PWA Mobile Installation Banner */}
      <MobilePWAInstallBanner />

      {/* Main App Navbar Header */}
      <Header
        lineConfig={lineConfig}
        promptPayConfig={promptPayConfig}
        overdueCount={overdueBillsCount}
        googleUser={googleUser}
        onOpenGoogleAuth={() => setIsGoogleAuthOpen(true)}
        onOpenNewBill={() => setIsNewBillOpen(true)}
        onOpenLineSettings={() => setIsLineSettingsOpen(true)}
        onOpenPromptPay={() => setIsPromptPayOpen(true)}
        onOpenFriendManager={() => setIsFriendManagerOpen(true)}
        onOpenLineGroupBot={() => setIsLineGroupBotOpen(true)}
        onOpenMeowTracker={() => setIsNewBearTransactionOpen(true)}
        onOpenSettleDebt={() => setIsSettleDebtOpen(true)}
        onClearAllData={handleClearAllData}
        onRestoreDemoData={handleRestoreDemoData}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4   pt-6">
        
        {/* Top Primary Navigation Bar: 2 Main Functions (Hidden on mobile) */}
        <div className="hidden bg-slate-900 border border-slate-800 p-2 rounded-2xl mb-4 shadow-xl flex-col  items-center justify-between gap-3">
          <div className="flex items-center space-x-2 w-full ">
            <button
              onClick={() => setMainMode('BEAR_PAY')}
              className={`flex-1  flex items-center justify-center space-x-2 px-5 py-3 rounded-xl text-xs  font-black transition-all ${
                mainMode === 'BEAR_PAY'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 scale-[1.02]'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span className="text-base">🤝</span>
              <span>หารค่าใช้จ่ายกลุ่ม</span>
            </button>

            <button
              onClick={() => setMainMode('BEAR_JOD')}
              className={`flex-1  flex items-center justify-center space-x-2 px-5 py-3 rounded-xl text-xs  font-black transition-all ${
                mainMode === 'BEAR_JOD'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-400 text-slate-950 shadow-lg shadow-amber-500/20 scale-[1.02]'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span className="text-base">🐻</span>
              <span>บันทึกรายรับ-รายจ่าย 📸</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 hidden  items-center space-x-2 px-3">
            {mainMode === 'BEAR_PAY' ? (
              <span className="text-emerald-300 font-bold flex items-center space-x-1">
                <span>💬 แยกบิลกลุ่ม & ส่งสรุปยอดทวงหนี้</span>
              </span>
            ) : (
              <span className="text-amber-300 font-bold flex items-center space-x-1">
                <span>🐻📱 บันทึกส่วนบุคคล & สแกนสลิปด้วย AI</span>
              </span>
            )}
          </div>
        </div>

        {/* FUNCTION 1: BEAR PAY (BILL SPLITTING & DEBT TRACKING) */}
        {mainMode === 'BEAR_PAY' && (
          <div className="space-y-6">
            {/* Financial Metrics Cards */}
            <DashboardCards
              totalOwedToMe={totalOwedToMe}
              totalIOweThem={totalIOweThem}
              netBalance={netBalance}
              overdueBillsCount={overdueBillsCount}
              pendingSlipsCount={pendingSlipsCount}
              onSendAllReminders={handleSendAllReminders}
            />

            {/* Primary View Switcher Tabs (Hidden on mobile) */}
            <div className="hidden items-center space-x-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 w-fit mb-6">
              <button
                onClick={() => setActiveTab('INDIVIDUAL')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'INDIVIDUAL'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>สรุปยอดบุคคล</span>
              </button>

              <button
                onClick={() => setActiveTab('BILLS')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'BILLS'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>บิลทั้งหมด ({bills.length})</span>
              </button>
            </div>

            {/* Tab View 1: Individual Balance Summary */}
            {activeTab === 'INDIVIDUAL' && (
              <IndividualSummary
                summaries={individualSummaries}
                myPromptPayTarget={promptPayConfig.target}
                myPromptPayName={promptPayConfig.name}
                onSendLineReminder={handleSendIndividualLineReminder}
                onShowPromptPayQr={(personName, amount) => {
                  const person = people.find(p => p.name === personName);
                  if (person) {
                    setFlexModalData({
                      isOpen: true,
                      messageText: `💳 พร้อมเพย์สำหรับชำระเงิน (${promptPayConfig.target} - ${promptPayConfig.name})\nจำนวนยอดเงิน: ${formatTHB(amount)}`,
                      debtorName: personName,
                      amount,
                    });
                  }
                }}
                onClearPersonDebt={handleClearPersonDebt}
              />
            )}

            {/* Tab View 2: Bills List */}
            {activeTab === 'BILLS' && (
              <BillList
                bills={bills}
                people={people}
                onSelectBill={bill => setSelectedBill(bill)}
                onSendBillReminder={handleSendBillReminder}
                onOpenNewBill={() => setIsNewBillOpen(true)}
              />
            )}
          </div>
        )}

        {/* FUNCTION 2: BEAR JOD (PERSONAL INCOME & EXPENSE LEDGER & MONTHLY REPORT) */}
        {mainMode === 'BEAR_JOD' && (
          <BearJodInlineView
            people={people}
            transactions={bearTransactions}
            selectedAccountId="me"
            onAddTransaction={handleAddBearTransaction}
            onDeleteTransaction={handleDeleteBearTransaction}
            onClearAllData={handleClearAllData}
          />
        )}

      </main>


      {/* Modals */}
      <NewBillModal
        isOpen={isNewBillOpen}
        onClose={() => setIsNewBillOpen(false)}
        people={people}
        onSaveBill={handleSaveNewBill}
      />

      <BillDetailModal
        bill={selectedBill}
        people={people}
        myPromptPay={promptPayConfig}
        isOpen={Boolean(selectedBill)}
        onClose={() => setSelectedBill(null)}
        onUpdateParticipantStatus={handleUpdateParticipantStatus}
        onSendParticipantReminder={(bill, person, amount) => {
          const message = generateLineReminderMessage(
            person.name,
            'ตัวฉัน',
            bill.title,
            amount,
            bill.dueDate,
            promptPayConfig.target,
            promptPayConfig.name,
            lineConfig.appUrl || 'https://www.bearpay-app.com'
          );
          setFlexModalData({
            isOpen: true,
            messageText: message,
            debtorName: person.name,
            amount,
          });
        }}
        onDeleteBill={handleDeleteBill}
      />

      <LineSettingsModal
        isOpen={isLineSettingsOpen}
        onClose={() => setIsLineSettingsOpen(false)}
        config={lineConfig}
        onSaveConfig={setLineConfig}
        logs={notificationLogs}
      />

      <PromptPayModal
        isOpen={isPromptPayOpen}
        onClose={() => setIsPromptPayOpen(false)}
        config={promptPayConfig}
        onSaveConfig={setPromptPayConfig}
      />

      <FriendManagerModal
        isOpen={isFriendManagerOpen}
        onClose={() => setIsFriendManagerOpen(false)}
        people={people}
        onSavePeople={setPeople}
      />

      <LineFlexCardModal
        isOpen={flexModalData.isOpen}
        onClose={() => setFlexModalData(prev => ({ ...prev, isOpen: false }))}
        messageText={flexModalData.messageText}
        debtorName={flexModalData.debtorName}
        amount={flexModalData.amount}
        promptPayTarget={promptPayConfig.target}
      />

      <LineGroupBotModal
        onConfirmSettlePersonDebt={handleSettleFullPersonDebt}
        isOpen={isLineGroupBotOpen}
        onClose={() => setIsLineGroupBotOpen(false)}
        people={people}
        bills={bills}
        promptPayConfig={promptPayConfig}
        onLogNotification={(recipientName, billTitle) => {
          addNotificationLog({
            recipientName,
            billTitle,
            amount: 0,
            status: 'SUCCESS',
            message: 'เรียก BearPay กลุ่ม LINE ติดตามหนี้อัตโนมัติ',
          });
          setNotificationLogs(getNotificationLogs());
        }}
      />

      <NewBearTransactionModal
        isOpen={isNewBearTransactionOpen}
        onClose={() => setIsNewBearTransactionOpen(false)}
        onAddTransaction={handleAddBearTransaction}
      />

      <SettleDebtModal
        isOpen={isSettleDebtOpen}
        onClose={() => setIsSettleDebtOpen(false)}
        people={people}
        bills={bills}
        summaries={individualSummaries}
        onConfirmSettlePersonDebt={handleSettleFullPersonDebt}
        onConfirmSettleBillDebt={handleSettleBillDebt}
      />

      <GoogleAuthModal
        isOpen={isGoogleAuthOpen}
        onClose={() => setIsGoogleAuthOpen(false)}
        currentUser={googleUser}
        onLogin={handleGoogleLogin}
        onLogout={handleGoogleLogout}
      />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={
          mainMode === 'BEAR_JOD'
            ? 'HOME'
            : activeTab === 'BILLS'
            ? 'BILLS'
            : 'FRIENDS'
        }
        onTabChange={(tab) => {
          if (tab === 'HOME') {
            setMainMode('BEAR_JOD');
          } else if (tab === 'FRIENDS') {
            setMainMode('BEAR_PAY');
            setActiveTab('INDIVIDUAL');
          } else if (tab === 'BILLS') {
            setMainMode('BEAR_PAY');
            setActiveTab('BILLS');
          } else if (tab === 'LINE_BOT') {
            setIsLineGroupBotOpen(true);
          } else if (tab === 'SETTINGS') {
            setIsPromptPayOpen(true);
          }
        }}
        onOpenNewTransactionModal={() => setIsNewBearTransactionOpen(true)}
        onOpenNewBillModal={() => setIsNewBillOpen(true)}
      />

    </div>
  );
}
