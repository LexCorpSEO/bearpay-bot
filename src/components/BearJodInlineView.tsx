import React, { useState } from 'react';
import { BearTransaction, Person } from '../types';
import { formatTHB, formatThaiDate } from '../utils/thaiFormatters';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from './BearTrackerModal';
import { compressImageForAI } from '../utils/imageCompressor';
import {
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Wallet,
  Sparkles,
  Copy,
  Check,
  BarChart2,
  PieChart as PieIcon,
  Users,
  Calendar as CalendarIcon,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  ListFilter,
  Target,
  Sliders,
  Edit2,
  Camera,
  Upload,
  Loader2,
  CheckCircle,
  FileText,
  Image as ImageIcon,
  PiggyBank,
  Trophy,
  Award,
  Flag
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface BearJodInlineViewProps {
  people: Person[];
  transactions: BearTransaction[];
  selectedAccountId?: string;
  onSelectAccount?: (id: string) => void;
  onAddTransaction: (transaction: Omit<BearTransaction, 'id' | 'createdAt'>) => void;
  onDeleteTransaction: (id: string) => void;
  onClearAllData?: () => void;
}

const THAI_MONTH_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const THAI_MONTH_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

const DAY_NAMES = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

export const BearJodInlineView: React.FC<BearJodInlineViewProps> = ({
  people = [],
  transactions = [],
  selectedAccountId = 'me',
  onSelectAccount,
  onAddTransaction,
  onDeleteTransaction,
  onClearAllData,
}) => {
  const today = new Date();
  const todayIso = today.toISOString().split('T')[0];

  // Active view tab: RECORD vs CALENDAR vs REPORT
  const [activeTab, setActiveTab] = useState<'RECORD' | 'CALENDAR' | 'REPORT'>('RECORD');

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [filterType, setFilterType] = useState<'ALL' | 'EXPENSE' | 'INCOME'>('ALL');

  // Calendar States
  const [calYear, setCalYear] = useState<number>(today.getFullYear());
  const [calMonth, setCalMonth] = useState<number>(today.getMonth()); // 0-indexed
  const [selectedCalDate, setSelectedCalDate] = useState<string | null>(todayIso);

  // Form states
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [amount, setAmount] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>(EXPENSE_CATEGORIES[0].name);
  const [selectedCategoryIcon, setSelectedCategoryIcon] = useState<string>(EXPENSE_CATEGORIES[0].icon);
  const [bearMood, setBearMood] = useState<string>(EXPENSE_CATEGORIES[0].mood);
  const [date, setDate] = useState<string>(todayIso);
  const [note, setNote] = useState<string>('');
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  // AI Slip & Receipt Scan States
  const [isScanningSlip, setIsScanningSlip] = useState<boolean>(false);
  const [scanSuccessMsg, setScanSuccessMsg] = useState<string | null>(null);
  const [attachedSlipUrl, setAttachedSlipUrl] = useState<string | null>(null);
  const [viewingSlipUrl, setViewingSlipUrl] = useState<string | null>(null);

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
    }
  };

  // Monthly Budget State
  const [monthlyBudget, setMonthlyBudget] = useState<number>(() => {
    const saved = localStorage.getItem('khunthong_bear_monthly_budget_v1');
    if (saved) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return 15000;
  });

  const [isEditingBudget, setIsEditingBudget] = useState<boolean>(false);
  const [inputBudgetValue, setInputBudgetValue] = useState<string>('');

  const handleOpenEditBudget = () => {
    setInputBudgetValue(monthlyBudget.toString());
    setIsEditingBudget(true);
  };

  const handleSaveBudget = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsed = parseFloat(inputBudgetValue);
    if (isNaN(parsed) || parsed <= 0) {
      alert('กรุณากรอกจำนวนงบประมาณให้ถูกต้อง');
      return;
    }
    setMonthlyBudget(parsed);
    localStorage.setItem('khunthong_bear_monthly_budget_v1', parsed.toString());
    setIsEditingBudget(false);
  };

  // Savings Goal State
  const [savingsGoalTitle, setSavingsGoalTitle] = useState<string>(() => {
    const saved = localStorage.getItem('khunthong_bear_savings_goal_title_v1');
    return saved || 'ออมเงินเที่ยวต่างประเทศ 🇯🇵';
  });

  const [savingsGoalTarget, setSavingsGoalTarget] = useState<number>(() => {
    const saved = localStorage.getItem('khunthong_bear_savings_goal_target_v1');
    if (saved) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return 50000;
  });

  const [isAutoNetSavings, setIsAutoNetSavings] = useState<boolean>(() => {
    const saved = localStorage.getItem('khunthong_bear_savings_auto_mode_v1');
    return saved !== null ? saved === 'true' : true;
  });

  const [manualSavingsAmount, setManualSavingsAmount] = useState<number>(() => {
    const saved = localStorage.getItem('khunthong_bear_savings_manual_amount_v1');
    if (saved) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= 0) return parsed;
    }
    return 0;
  });

  const [isEditingSavingsGoal, setIsEditingSavingsGoal] = useState<boolean>(false);
  const [inputGoalTitle, setInputGoalTitle] = useState<string>('');
  const [inputGoalTarget, setInputGoalTarget] = useState<string>('');
  const [inputGoalAutoMode, setInputGoalAutoMode] = useState<boolean>(true);
  const [inputGoalManualAmount, setInputGoalManualAmount] = useState<string>('0');

  const handleOpenEditSavingsGoal = () => {
    setInputGoalTitle(savingsGoalTitle);
    setInputGoalTarget(savingsGoalTarget.toString());
    setInputGoalAutoMode(isAutoNetSavings);
    setInputGoalManualAmount(manualSavingsAmount.toString());
    setIsEditingSavingsGoal(true);
  };

  const handleSaveSavingsGoal = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const parsedTarget = parseFloat(inputGoalTarget);
    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      alert('กรุณากรอกยอดเป้าหมายการออมเงินให้ถูกต้อง');
      return;
    }
    const parsedManual = parseFloat(inputGoalManualAmount) || 0;
    const newTitle = inputGoalTitle.trim() || 'เป้าหมายการออมเงินของฉัน 🎯';

    setSavingsGoalTitle(newTitle);
    setSavingsGoalTarget(parsedTarget);
    setIsAutoNetSavings(inputGoalAutoMode);
    setManualSavingsAmount(parsedManual);

    localStorage.setItem('khunthong_bear_savings_goal_title_v1', newTitle);
    localStorage.setItem('khunthong_bear_savings_goal_target_v1', parsedTarget.toString());
    localStorage.setItem('khunthong_bear_savings_auto_mode_v1', inputGoalAutoMode.toString());
    localStorage.setItem('khunthong_bear_savings_manual_amount_v1', parsedManual.toString());

    setIsEditingSavingsGoal(false);
  };

  const safePeople = Array.isArray(people) ? people : [];
  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  const meUser = safePeople.find(p => p.isMe) || safePeople[0] || { id: 'p_lek', name: 'ฉัน', isMe: true };

  // Filter transactions strictly for personal ledger
  const myPersonalTransactions = safeTransactions.filter(t => {
    if (!t) return false;
    if (selectedAccountId === 'ALL') return true;
    if (t.personId) return t.personId === selectedAccountId;
    if (selectedAccountId === 'p_lek' || selectedAccountId === 'me') {
      return !t.personId || t.personId === 'me' || t.personId === 'p_lek';
    }
    return false;
  });

  // Monthly Budget Calculation (Current Month Expenses)
  const currentMonthIsoPrefix = todayIso.slice(0, 7); // YYYY-MM
  const currentMonthExpenseTotal = myPersonalTransactions
    .filter(t => t.type === 'EXPENSE' && t.date && t.date.startsWith(currentMonthIsoPrefix))
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const budgetSpentPercentage = monthlyBudget > 0 ? (currentMonthExpenseTotal / monthlyBudget) * 100 : 0;
  const remainingBudget = monthlyBudget - currentMonthExpenseTotal;

  // Overall Stats
  const totalIncome = myPersonalTransactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalExpense = myPersonalTransactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const netSavings = totalIncome - totalExpense;

  // Savings Goal Calculations
  const baseSavingsFromLedger = Math.max(0, netSavings);
  const currentSavingsAmount = isAutoNetSavings
    ? baseSavingsFromLedger + manualSavingsAmount
    : manualSavingsAmount;

  const savingsProgressPercentage = savingsGoalTarget > 0 ? (currentSavingsAmount / savingsGoalTarget) * 100 : 0;
  const savingsRemainingAmount = Math.max(0, savingsGoalTarget - currentSavingsAmount);

  // Search & Filtered Transactions
  const filteredTransactions = myPersonalTransactions.filter(t => {
    // Type Filter
    if (filterType === 'EXPENSE' && t.type !== 'EXPENSE') return false;
    if (filterType === 'INCOME' && t.type !== 'INCOME') return false;

    // Category Filter
    if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;

    // Date Filter
    if (dateFilter && t.date !== dateFilter) return false;

    // Text Search Query (note, category, amount, date)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchNote = (t.note || '').toLowerCase().includes(q);
      const matchCategory = (t.category || '').toLowerCase().includes(q);
      const matchAmount = (t.amount || 0).toString().includes(q);
      const matchDate = (t.date || '').includes(q);
      if (!matchNote && !matchCategory && !matchAmount && !matchDate) return false;
    }

    return true;
  });

  const allCategories = Array.from(
    new Set([
      ...EXPENSE_CATEGORIES.map(c => c.name),
      ...INCOME_CATEGORIES.map(c => c.name)
    ])
  );

  // Calendar Calculations
  const firstDayOfMonth = new Date(calYear, calMonth, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(prev => prev - 1);
    } else {
      setCalMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(prev => prev + 1);
    } else {
      setCalMonth(prev => prev + 1);
    }
  };

  const handleGoToToday = () => {
    const now = new Date();
    setCalYear(now.getFullYear());
    setCalMonth(now.getMonth());
    setSelectedCalDate(todayIso);
  };

  // Group transactions by date string YYYY-MM-DD
  const dailyTransactionsMap: Record<string, BearTransaction[]> = {};
  myPersonalTransactions.forEach(t => {
    if (!t.date) return;
    if (!dailyTransactionsMap[t.date]) {
      dailyTransactionsMap[t.date] = [];
    }
    dailyTransactionsMap[t.date].push(t);
  });

  // Monthly Chart Data
  const monthlyChartData = (() => {
    const monthMap: Record<string, { income: number; expense: number }> = {};

    myPersonalTransactions.forEach(t => {
      if (!t.date) return;
      const monthKey = t.date.slice(0, 7);
      if (!monthMap[monthKey]) {
        monthMap[monthKey] = { income: 0, expense: 0 };
      }
      if (t.type === 'INCOME') {
        monthMap[monthKey].income += t.amount || 0;
      } else {
        monthMap[monthKey].expense += t.amount || 0;
      }
    });

    const currentMonthKey = todayIso.slice(0, 7);
    if (!monthMap[currentMonthKey]) {
      monthMap[currentMonthKey] = { income: 0, expense: 0 };
    }

    const keys = Object.keys(monthMap).sort();

    return keys.map(mKey => {
      const parts = mKey.split('-');
      const yearStr = parts[0] || '2026';
      const monthStr = parts[1] || '01';
      const monthIdx = parseInt(monthStr, 10) - 1;
      const yearBE = parseInt(yearStr, 10) + 543;
      const monthLabel = `${THAI_MONTH_SHORT[monthIdx] || monthStr} ${yearBE}`;

      const inc = monthMap[mKey].income || 0;
      const exp = monthMap[mKey].expense || 0;
      return {
        monthKey: mKey,
        monthLabel,
        income: inc,
        expense: exp,
        net: inc - exp,
      };
    });
  })();

  // Category breakdown
  const categoryBreakdown = (() => {
    const catMap: Record<string, { amount: number; icon: string; color: string }> = {};

    myPersonalTransactions
      .filter(t => t.type === 'EXPENSE')
      .forEach(t => {
        const catInfo = EXPENSE_CATEGORIES.find(c => c.name === t.category);
        const catColor = catInfo ? catInfo.color : '#64748b';
        if (!catMap[t.category]) {
          catMap[t.category] = { amount: 0, icon: t.categoryIcon || '📦', color: catColor };
        }
        catMap[t.category].amount += t.amount || 0;
      });

    return Object.entries(catMap)
      .map(([category, { amount, icon, color }]) => ({
        category,
        amount,
        icon,
        color,
        percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  })();

  const handleTypeChange = (newType: 'EXPENSE' | 'INCOME') => {
    setType(newType);
    if (newType === 'EXPENSE') {
      setSelectedCategory(EXPENSE_CATEGORIES[0].name);
      setSelectedCategoryIcon(EXPENSE_CATEGORIES[0].icon);
      setBearMood(EXPENSE_CATEGORIES[0].mood);
    } else {
      setSelectedCategory(INCOME_CATEGORIES[0].name);
      setSelectedCategoryIcon(INCOME_CATEGORIES[0].icon);
      setBearMood(INCOME_CATEGORIES[0].mood);
    }
  };

  const handleSelectCategory = (catName: string, icon: string, mood: string) => {
    setSelectedCategory(catName);
    setSelectedCategoryIcon(icon);
    setBearMood(mood);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('กรุณากรอกจำนวนเงินให้ถูกต้อง');
      return;
    }

    const currentPersonId = selectedAccountId === 'ALL' ? (meUser.id || 'me') : selectedAccountId;

    onAddTransaction({
      personId: currentPersonId,
      type,
      amount: parsedAmount,
      category: selectedCategory,
      categoryIcon: selectedCategoryIcon,
      date: date || todayIso,
      note: note.trim() || selectedCategory,
      bearMood,
      slipUrl: attachedSlipUrl || undefined,
    });

    setAmount('');
    setNote('');
    setAttachedSlipUrl(null);
    setScanSuccessMsg(null);
  };

  const handleCopySummary = () => {
    const summaryText = `🐻 [หมีจด - สรุปบันทึกรายรับ-รายจ่ายส่วนตัวของฉัน]\n\n💰 รายรับรวม: ${formatTHB(totalIncome)}\n💸 รายจ่ายรวม: ${formatTHB(totalExpense)}\n⚖️ เงินคงเหลือสุทธิ: ${formatTHB(netSavings)}\n\n🐻 พี่หมีจดบันทึกบัญชีส่วนตัวให้อย่างเป็นระเบียบเรียบร้อยฮะ! ✨`;
    navigator.clipboard.writeText(summaryText);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2500);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('ALL');
    setDateFilter('');
    setFilterType('ALL');
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const incVal = payload.find((p: any) => p.dataKey === 'income')?.value ?? 0;
      const expVal = payload.find((p: any) => p.dataKey === 'expense')?.value ?? 0;
      const netVal = incVal - expVal;

      return (
        <div className="bg-slate-950 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1">
          <div className="font-bold text-slate-100 border-b border-slate-800 pb-1 flex items-center justify-between">
            <span>🗓️ {label}</span>
          </div>
          <div className="flex justify-between space-x-4 text-emerald-400 font-bold">
            <span>💰 รายรับ:</span>
            <span>{formatTHB(incVal)}</span>
          </div>
          <div className="flex justify-between space-x-4 text-rose-400 font-bold">
            <span>💸 รายจ่าย:</span>
            <span>{formatTHB(expVal)}</span>
          </div>
          <div className={`flex justify-between space-x-4 font-black border-t border-slate-800 pt-1 ${netVal >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
            <span>⚖️ สุทธิ:</span>
            <span>{formatTHB(netVal)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      
      {/* Function Header Banner */}
      <div className="bg-gradient-to-r from-amber-600/30 via-orange-600/20 to-amber-700/30 border border-amber-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col   justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-4xl shadow-inner shrink-0">
              🐻
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  ฟังก์ชันที่ 2
                </span>
                <h2 className="text-2xl font-black text-white tracking-tight">หมีจด (บัญชีส่วนตัว)</h2>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-md">
                บันทึกและจัดการรายรับ-รายจ่ายส่วนตัวของคุณอย่างปลอดภัย
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-start ">
            <button
              onClick={handleCopySummary}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg flex items-center space-x-2 transition-all active:scale-95"
            >
              {copiedSummary ? <Check className="w-4 h-4 text-slate-950" /> : <Copy className="w-4 h-4 text-slate-950" />}
              <span>{copiedSummary ? 'คัดลอกสรุปแล้ว!' : 'คัดลอกสรุปบัญชีเข้า LINE'}</span>
            </button>
          </div>
        </div>

        {/* Financial Metrics Cards */}
        <div className="grid grid-cols-1  gap-3 mt-6">
          <div className="bg-slate-950/80 p-4 rounded-2xl border border-emerald-500/30 shadow-inner">
            <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider flex items-center space-x-1.5">
              <TrendingUp className="w-4 h-4" />
              <span>รายรับรวม (บัญชีส่วนตัว)</span>
            </div>
            <div className="text-xl font-black text-emerald-400 mt-2">
              {formatTHB(totalIncome)}
            </div>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-2xl border border-rose-500/30 shadow-inner">
            <div className="text-xs text-rose-400 font-bold uppercase tracking-wider flex items-center space-x-1.5">
              <TrendingDown className="w-4 h-4" />
              <span>รายจ่ายรวม</span>
            </div>
            <div className="text-xl font-black text-rose-400 mt-2">
              {formatTHB(totalExpense)}
            </div>
          </div>

          <div className="bg-slate-950/80 p-4 rounded-2xl border border-amber-500/30 shadow-inner">
            <div className="text-xs text-amber-400 font-bold uppercase tracking-wider flex items-center space-x-1.5">
              <Wallet className="w-4 h-4" />
              <span>เงินคงเหลือสุทธิ</span>
            </div>
            <div className={`text-xl font-black mt-2 ${netSavings >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
              {formatTHB(netSavings)}
            </div>
          </div>
        </div>
      </div>

      {/* Private Ledger Notice Badge */}
      <div className="bg-slate-900 border border-amber-500/20 rounded-2xl p-3.5 flex flex-col  items-start  justify-between gap-2 text-xs text-slate-300 shadow-lg">
        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 rounded-lg font-bold border border-amber-500/30 flex items-center space-x-1">
            <span>🔒</span>
            <span>บัญชีส่วนตัว (Personal Ledger)</span>
          </span>
          <span className="text-slate-300 font-medium">ฟังก์ชันของใครของมัน บันทึกรายรับ-รายจ่ายเฉพาะส่วนตัวของคุณ 100%</span>
        </div>
      </div>

      {/* Monthly Budget Tracker & Warning Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col  items-start  justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-black text-white">งบประมาณรายเดือน (Monthly Budget)</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-amber-300 border border-slate-700">
                  {THAI_MONTH_FULL[today.getMonth()]} {today.getFullYear() + 543}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                กำหนดเพดานรายจ่ายประจำเดือน เพื่อช่วยเตือนสติก่อนใช้เงินเกินงบ
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenEditBudget}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl border border-amber-500/30 flex items-center space-x-1.5 transition-all shadow shrink-0"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>ตั้งงบประมาณ ({formatTHB(monthlyBudget)})</span>
          </button>
        </div>

        {/* Edit Budget Form Modal/Inline Expand */}
        {isEditingBudget && (
          <form onSubmit={handleSaveBudget} className="bg-slate-950 border border-amber-500/40 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 flex items-center space-x-1">
                <Sliders className="w-3.5 h-3.5" />
                <span>กำหนดวงเงินงบประมาณรายเดือนใหม่</span>
              </span>
              <button
                type="button"
                onClick={() => setIsEditingBudget(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col  items-center gap-2">
              <div className="relative w-full">
                <input
                  type="number"
                  placeholder="เช่น 15000"
                  value={inputBudgetValue}
                  onChange={e => setInputBudgetValue(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-white font-bold outline-none"
                  min="0"
                  step="any"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">บาท</span>
              </div>

              <div className="flex items-center space-x-2 w-full  shrink-0">
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow w-full "
                >
                  บันทึกวงเงิน
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingBudget(false)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl w-full "
                >
                  ยกเลิก
                </button>
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400 mr-1">เลือกด่วน:</span>
              {[5000, 10000, 15000, 20000, 30000, 50000].map(amountPreset => (
                <button
                  key={amountPreset}
                  type="button"
                  onClick={() => setInputBudgetValue(amountPreset.toString())}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-amber-300 text-[11px] font-bold rounded-lg transition-all"
                >
                  {formatTHB(amountPreset)}
                </button>
              ))}
            </div>
          </form>
        )}

        {/* Budget Progress Metrics */}
        <div className="grid grid-cols-1  gap-3">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-bold">🎯 งบประมาณตั้งไว้</span>
            <div className="text-base font-black text-white mt-0.5">{formatTHB(monthlyBudget)}</div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-bold">💸 รายจ่ายสะสมเดือนนี้</span>
            <div className="text-base font-black text-rose-400 mt-0.5">{formatTHB(currentMonthExpenseTotal)}</div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-bold">🪙 งบสั่งจ่ายคงเหลือ</span>
            <div className={`text-base font-black mt-0.5 ${remainingBudget >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {remainingBudget >= 0 ? formatTHB(remainingBudget) : `เกินงบ ${formatTHB(Math.abs(remainingBudget))}`}
            </div>
          </div>
        </div>

        {/* Progress Bar Container */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-300 flex items-center space-x-1">
              <span>ความคืบหน้าการใช้เงินงบประมาณ</span>
            </span>
            <span className={`font-black ${
              budgetSpentPercentage > 100 ? 'text-rose-400' :
              budgetSpentPercentage >= 90 ? 'text-rose-300' :
              budgetSpentPercentage >= 70 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              ใช้ไป {budgetSpentPercentage.toFixed(1)}% {budgetSpentPercentage > 100 ? '(เกินงบแล้ว!)' : ''}
            </span>
          </div>

          <div className="w-full bg-slate-950 h-3.5 rounded-full p-0.5 border border-slate-800 overflow-hidden relative">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                budgetSpentPercentage > 100
                  ? 'bg-gradient-to-r from-rose-600 via-red-500 to-rose-700 animate-pulse'
                  : budgetSpentPercentage >= 90
                  ? 'bg-gradient-to-r from-orange-500 to-rose-500'
                  : budgetSpentPercentage >= 70
                  ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-400'
              }`}
              style={{ width: `${Math.min(budgetSpentPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Bear Warning Message Callout */}
        <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center space-x-2.5 ${
          budgetSpentPercentage > 100
            ? 'bg-rose-950/80 border-rose-500/50 text-rose-200'
            : budgetSpentPercentage >= 90
            ? 'bg-orange-950/80 border-orange-500/50 text-orange-200'
            : budgetSpentPercentage >= 70
            ? 'bg-amber-950/70 border-amber-500/40 text-amber-200'
            : 'bg-emerald-950/60 border-emerald-500/30 text-emerald-200'
        }`}>
          <div className="text-2xl shrink-0">
            {budgetSpentPercentage > 100 ? '🚨' : budgetSpentPercentage >= 90 ? '⚠️' : budgetSpentPercentage >= 70 ? '💡' : '✨'}
          </div>
          <div>
            <div className="font-bold flex items-center space-x-1">
              <span>
                {budgetSpentPercentage > 100 ? '🐻🚨 พี่หมีเตือนภัยด่วน! เกินงบประมาณแล้ว' :
                 budgetSpentPercentage >= 90 ? '🐻⚠️ พี่หมีเตือนภัย! ใกล้ถึงเพดานงบประมาณ' :
                 budgetSpentPercentage >= 70 ? '🐻💡 พี่หมีแจ้งเตือน: เริ่มใกล้งบประมาณแล้ว' :
                 '🐻✨ พี่หมีประทานพร: การเงินคุณอยู่ในเกณฑ์ดีเยี่ยม'}
              </span>
            </div>
            <p className="text-[11px] opacity-90 mt-0.5">
              {budgetSpentPercentage > 100
                ? `เดือนนี้คุณใช้จ่ายเกินงบไปแล้ว ${formatTHB(Math.abs(remainingBudget))} ! พี่หมีขอร้องเพลาๆ ช้อปปิ้งด่วนๆ เลยฮะ`
                : budgetSpentPercentage >= 90
                ? `ใช้ไป ${budgetSpentPercentage.toFixed(1)}% ของงบแล้ว เหลือสั่งจ่ายได้อีกแค่ ${formatTHB(remainingBudget)} ระวังกระเป๋าฉีกนะฮะ!`
                : budgetSpentPercentage >= 70
                ? `ใช้ไป ${budgetSpentPercentage.toFixed(1)}% ของงบประมาณแล้ว บริหารเงินช่วงปลายเดือนดีๆ นะฮะ`
                : `ใช้ไปเพียง ${budgetSpentPercentage.toFixed(1)}% ยังเหลือใช้ได้อีก ${formatTHB(remainingBudget)} ให้พี่หมีอุ่นใจฮะ!`}
            </p>
          </div>
        </div>
      </div>

      {/* Savings Goal Tracker Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col  items-start  justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-black text-white">เป้าหมายการออมเงิน (Savings Goal)</h3>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                  <Trophy className="w-3 h-3" />
                  <span>{savingsGoalTitle}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                ตั้งเป้าหมายสะสมเงินออม ติดตามความคืบหน้าด้วย Progress Bar แบบเรียลไทม์
              </p>
            </div>
          </div>

          <button
            onClick={handleOpenEditSavingsGoal}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs rounded-xl border border-emerald-500/30 flex items-center space-x-1.5 transition-all shadow shrink-0"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>ตั้งเป้าหมาย ({formatTHB(savingsGoalTarget)})</span>
          </button>
        </div>

        {/* Edit Savings Goal Form */}
        {isEditingSavingsGoal && (
          <form onSubmit={handleSaveSavingsGoal} className="bg-slate-950 border border-emerald-500/40 p-4 rounded-xl space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5">
                <PiggyBank className="w-4 h-4" />
                <span>กำหนดเป้าหมายการออมเงินใหม่</span>
              </span>
              <button
                type="button"
                onClick={() => setIsEditingSavingsGoal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1  gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300 mb-1 block">🎯 ชื่อเป้าหมายออมเงิน</label>
                <input
                  type="text"
                  placeholder="เช่น ออมเงินเที่ยวญี่ปุ่น 🇯🇵, กองทุนเงินสำรอง"
                  value={inputGoalTitle}
                  onChange={e => setInputGoalTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 mb-1 block">🏆 จำนวนเงินเป้าหมาย (บาท)</label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="เช่น 50000"
                    value={inputGoalTarget}
                    onChange={e => setInputGoalTarget(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white font-bold outline-none"
                    min="0"
                    step="any"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">บาท</span>
                </div>
              </div>
            </div>

            {/* Preset Amounts */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-slate-400 mr-1">เป้าหมายยอดฮิต:</span>
              {[10000, 30000, 50000, 100000, 200000, 500000].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setInputGoalTarget(amt.toString())}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-emerald-300 text-[11px] font-bold rounded-lg transition-all"
                >
                  {formatTHB(amt)}
                </button>
              ))}
            </div>

            {/* Savings Calculation Mode Selection */}
            <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2 text-xs">
              <span className="font-bold text-slate-200 block">⚙️ วิธีคำนวณเงินออมปัจจุบัน:</span>
              
              <label className="flex items-center space-x-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={inputGoalAutoMode}
                  onChange={e => setInputGoalAutoMode(e.target.checked)}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="font-medium">ดึงเงินคงเหลือสะสมส่วนตัวสุทธิ (รายรับ - รายจ่าย) ในระบบมาสมทบอัตโนมัติ</span>
              </label>

              <div className="pt-1.5 border-t border-slate-800 flex flex-col   justify-between gap-2">
                <label className="text-[11px] text-slate-400 font-semibold">
                  เงินออมตั้งต้น / เงินออมนอกระบบสมทบเพิ่ม (บาท):
                </label>
                <div className="relative w-full ">
                  <input
                    type="number"
                    placeholder="0"
                    value={inputGoalManualAmount}
                    onChange={e => setInputGoalManualAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-lg px-2.5 py-1 text-xs text-white font-bold outline-none"
                    min="0"
                    step="any"
                  />
                  <span className="absolute right-2.5 top-1 text-xs text-slate-400">บาท</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow transition-all"
              >
                บันทึกเป้าหมายการออมเงิน
              </button>
              <button
                type="button"
                onClick={() => setIsEditingSavingsGoal(false)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
              >
                ยกเลิก
              </button>
            </div>
          </form>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-2  gap-2.5">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-bold block">🎯 เป้าหมายเงินออม</span>
            <div className="text-sm  font-black text-white mt-0.5">{formatTHB(savingsGoalTarget)}</div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-bold block">💰 สะสมได้แล้ว</span>
            <div className="text-sm  font-black text-emerald-400 mt-0.5">{formatTHB(currentSavingsAmount)}</div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-bold block">🪙 ขาดอีกเพียง</span>
            <div className="text-sm  font-black text-amber-300 mt-0.5">
              {savingsRemainingAmount > 0 ? formatTHB(savingsRemainingAmount) : '🏆 ครบเป้าแล้ว!'}
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-bold block">📊 เปอร์เซ็นต์เป้าหมาย</span>
            <div className={`text-sm  font-black mt-0.5 ${
              savingsProgressPercentage >= 100 ? 'text-amber-400' :
              savingsProgressPercentage >= 75 ? 'text-emerald-400' :
              savingsProgressPercentage >= 50 ? 'text-teal-300' : 'text-cyan-300'
            }`}>
              {savingsProgressPercentage.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Progress Bar with Animated Glow */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-300 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>ความคืบหน้า ({savingsGoalTitle}):</span>
            </span>
            <span className={`font-black ${
              savingsProgressPercentage >= 100 ? 'text-amber-300 animate-bounce' :
              savingsProgressPercentage >= 75 ? 'text-emerald-300' :
              savingsProgressPercentage >= 50 ? 'text-teal-300' : 'text-cyan-300'
            }`}>
              {savingsProgressPercentage.toFixed(1)}% ({formatTHB(currentSavingsAmount)} / {formatTHB(savingsGoalTarget)})
            </span>
          </div>

          <div className="w-full bg-slate-950 h-4 rounded-full p-0.5 border border-slate-800 overflow-hidden relative shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                savingsProgressPercentage >= 100
                  ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 animate-pulse shadow-lg shadow-amber-500/50'
                  : savingsProgressPercentage >= 75
                  ? 'bg-gradient-to-r from-orange-400 via-amber-400 to-emerald-400'
                  : savingsProgressPercentage >= 50
                  ? 'bg-gradient-to-r from-teal-400 to-emerald-400'
                  : savingsProgressPercentage >= 25
                  ? 'bg-gradient-to-r from-cyan-400 to-teal-400'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-400'
              }`}
              style={{ width: `${Math.min(savingsProgressPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Motivational Bear Commentary */}
        <div className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center space-x-3 ${
          savingsProgressPercentage >= 100
            ? 'bg-amber-950/80 border-amber-500/60 text-amber-200 shadow-lg shadow-amber-500/10'
            : savingsProgressPercentage >= 75
            ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
            : savingsProgressPercentage >= 50
            ? 'bg-teal-950/60 border-teal-500/40 text-teal-200'
            : 'bg-slate-950 border-slate-800 text-slate-300'
        }`}>
          <div className="text-3xl shrink-0">
            {savingsProgressPercentage >= 100 ? '🏆' : savingsProgressPercentage >= 75 ? '💎' : savingsProgressPercentage >= 50 ? '🚀' : savingsProgressPercentage >= 25 ? '🧗' : '🐻'}
          </div>
          <div>
            <div className="font-extrabold flex items-center space-x-1 text-white">
              <span>
                {savingsProgressPercentage >= 100 ? '🎉 พิชิตเป้าหมายออมเงินสำเร็จแล้ว!' :
                 savingsProgressPercentage >= 75 ? '💎 อีกแค่ก้าวเดียวก็ถึงฝันแล้วฮะ!' :
                 savingsProgressPercentage >= 50 ? '🚀 ก้าวผ่านครึ่งทางของเป้าหมายแล้ว!' :
                 savingsProgressPercentage >= 25 ? '🧗 เดินมาได้ 1 ใน 4 ของเป้าหมายแล้ว!' :
                 '🐻 จุดเริ่มต้นแห่งความสำเร็จของการออมเงิน'}
              </span>
            </div>
            <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">
              {savingsProgressPercentage >= 100
                ? `ยินดีด้วยครับ! คุณสะสมเงินออมบรรลุเป้าหมาย "${savingsGoalTitle}" ยอด ${formatTHB(savingsGoalTarget)} สำเร็จสมบูรณ์แบบ พี่หมีภูมิใจในความมีวินัยของคุณมากๆ ครับ!`
                : savingsProgressPercentage >= 75
                ? `สะสมได้ ${formatTHB(currentSavingsAmount)} (${savingsProgressPercentage.toFixed(1)}%) ขาดอีกเพียง ${formatTHB(savingsRemainingAmount)} พี่หมีขอส่งกำลังใจช่วยฮึบสู้ต่ออีกนิดนะฮะ!`
                : savingsProgressPercentage >= 50
                ? `ออมได้แล้ว ${formatTHB(currentSavingsAmount)} (${savingsProgressPercentage.toFixed(1)}%) คุณมีวินัยทางการเงินที่ยอดเยี่ยมมาก รักษาสปีดนี้ไว้เลยฮะ!`
                : savingsProgressPercentage >= 25
                ? `สะสมได้แล้ว ${formatTHB(currentSavingsAmount)} (${savingsProgressPercentage.toFixed(1)}%) เก็บเล็กผสมน้อยอย่างสม่ำเสมอ เป้าหมาย "${savingsGoalTitle}" อยู่ใกล้แค่มือเอื้อมฮะ`
                : `ยอดออมเงินปัจจุบันอยู่ที่ ${formatTHB(currentSavingsAmount)} (${savingsProgressPercentage.toFixed(1)}%) พี่หมีพร้อมสแตนด์บายคอยบันทึกและให้กำลังใจคุณทุกยอดออมฮะ!`}
            </p>
          </div>
        </div>
      </div>

      {/* Primary Sub-Tabs: Record & History vs Income-Expense Calendar vs Monthly Report */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 w-full ">
        <button
          onClick={() => setActiveTab('RECORD')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'RECORD'
              ? 'bg-amber-500 text-slate-950 shadow-md scale-[1.02]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>📝 บันทึกรับ-จ่าย & ค้นหาประวัติ</span>
        </button>

        <button
          onClick={() => setActiveTab('CALENDAR')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'CALENDAR'
              ? 'bg-amber-500 text-slate-950 shadow-md scale-[1.02]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>📅 ปฏิทินรายรับ-รายจ่าย</span>
        </button>

        <button
          onClick={() => setActiveTab('REPORT')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'REPORT'
              ? 'bg-emerald-500 text-slate-950 shadow-md scale-[1.02]'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>📊 รายงานสรุปกราฟแท่งรายเดือน</span>
        </button>
      </div>

      {/* VIEW 1: RECORD & HISTORY WITH SEARCH & FILTERS */}
      {activeTab === 'RECORD' && (
        <div className="grid grid-cols-1  gap-6">
          
          {/* Form Side (Hidden on Mobile, use floating '+' button instead) */}
          <div className="hidden bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl h-fit">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Plus className="w-4 h-4 text-amber-400" />
                <span>จดรายการใหม่ (ส่วนตัว)</span>
              </h3>

              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => handleTypeChange('EXPENSE')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    type === 'EXPENSE' ? 'bg-rose-500 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  💸 รายจ่าย
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('INCOME')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    type === 'INCOME' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  💰 รายรับ
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* AI Slip / Receipt Scanner Banner & Upload Button */}
              <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-600/15 border border-amber-500/30 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-amber-500/20 text-amber-300 rounded-xl">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center space-x-1">
                        <span>ถ่ายสรุป / ส่งสลิปโอนเงิน (AI สแกน)</span>
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <p className="text-[10px] text-slate-300">
                        แนบรูปสลิปหรือใบเสร็จ AI จะอ่านยอดเงิน ร้านค้า และวันที่จดให้อัตโนมัติ
                      </p>
                    </div>
                  </div>

                  <label className="cursor-pointer px-3 py-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs rounded-xl shadow border border-amber-400/50 flex items-center space-x-1.5 transition-all shrink-0">
                    {isScanningSlip ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>กำลังอ่าน...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>แนบสลิป/รูป</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleScanSlipOrReceipt}
                      disabled={isScanningSlip}
                      className="hidden"
                    />
                  </label>
                </div>

                {scanSuccessMsg && (
                  <div className="bg-emerald-950/80 border border-emerald-500/40 p-2 rounded-xl text-xs text-emerald-300 font-bold flex items-center justify-between">
                    <span className="flex items-center space-x-1.5">
                      <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>{scanSuccessMsg}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setScanSuccessMsg(null);
                        setAttachedSlipUrl(null);
                      }}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {attachedSlipUrl && (
                  <div className="flex items-center space-x-3 bg-slate-950 p-2 rounded-xl border border-slate-800">
                    <img
                      src={attachedSlipUrl}
                      alt="Slip Preview"
                      className="w-12 h-12 object-cover rounded-lg border border-slate-700 cursor-pointer hover:opacity-80"
                      onClick={() => setViewingSlipUrl(attachedSlipUrl)}
                    />
                    <div className="text-xs text-slate-300 flex-1">
                      <div className="font-bold text-amber-300 flex items-center space-x-1">
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>รูปสลิปที่แนบไว้</span>
                      </div>
                      <div className="text-[10px] text-slate-400">รูปนี้จะถูกบันทึกคู่กับรายการให้อัตโนมัติ</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachedSlipUrl(null)}
                      className="text-rose-400 hover:text-rose-300 text-xs px-2 py-1 bg-slate-900 rounded-lg"
                    >
                      ลบรูป
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  เลือกหมวดหมู่ ({type === 'EXPENSE' ? 'รายจ่าย' : 'รายรับ'}):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(type === 'EXPENSE' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(cat => {
                    const isSelected = selectedCategory === cat.name;
                    return (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => handleSelectCategory(cat.name, cat.icon, cat.mood)}
                        className={`p-2.5 rounded-2xl text-center border transition-all flex flex-col items-center justify-center space-y-1 ${
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

              <div className="space-y-3">
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
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2.5 text-base font-black text-white outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">วันที่</label>
                    <input
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">บันทึกเพิ่มเติม</label>
                    <input
                      type="text"
                      placeholder="เช่น กาแฟ, ค่าหอพัก..."
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 space-y-2">
                <div className="text-xs text-amber-300 flex items-center space-x-1.5">
                  <span>💬 ความเห็นพี่หมี:</span>
                  <span className="text-white italic">{bearMood}</span>
                </div>

                <button
                  type="submit"
                  className={`w-full py-2.5 rounded-xl font-bold text-xs text-slate-950 shadow-lg active:scale-95 transition-all flex items-center justify-center space-x-2 ${
                    type === 'EXPENSE' ? 'bg-amber-400 hover:bg-amber-300' : 'bg-emerald-400 hover:bg-emerald-300'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  <span>บันทึกหมีจด 🐻</span>
                </button>
              </div>
            </form>
          </div>

          {/* History Side with Search & Filter Bar */}
          <div className=" bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <span>ประวัติรายการบัญชี ({filteredTransactions.length})</span>
              </h3>

              {/* Type pills filter */}
              <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setFilterType('ALL')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    filterType === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ทั้งหมด
                </button>
                <button
                  onClick={() => setFilterType('EXPENSE')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    filterType === 'EXPENSE' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  รายจ่าย
                </button>
                <button
                  onClick={() => setFilterType('INCOME')}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                    filterType === 'INCOME' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  รายรับ
                </button>
              </div>
            </div>

            {/* SEARCH & ADVANCED FILTERS BAR */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="ค้นหาตามชื่อรายการ, โน้ต, หมวดหมู่, หรือจำนวนเงิน..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500/80 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1  gap-2 text-xs">
                {/* Category Dropdown */}
                <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5">
                  <Filter className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-slate-400 text-[11px] shrink-0">หมวดหมู่:</span>
                  <select
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    className="bg-transparent text-white text-xs font-semibold outline-none w-full cursor-pointer"
                  >
                    <option value="ALL" className="bg-slate-900 text-white">ทุกหมวดหมู่</option>
                    {allCategories.map(cat => (
                      <option key={cat} value={cat} className="bg-slate-900 text-white">{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Date Picker Filter */}
                <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-slate-400 text-[11px] shrink-0">วันที่:</span>
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={e => setDateFilter(e.target.value)}
                    className="bg-transparent text-white text-xs font-semibold outline-none w-full cursor-pointer"
                  />
                  {dateFilter && (
                    <button
                      onClick={() => setDateFilter('')}
                      className="text-slate-400 hover:text-white shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Clear filters badge */}
              {(searchQuery || categoryFilter !== 'ALL' || dateFilter || filterType !== 'ALL') && (
                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
                  <span className="text-amber-400 font-semibold flex items-center space-x-1">
                    <ListFilter className="w-3 h-3" />
                    <span>กำลังกรองข้อมูล (พบ {filteredTransactions.length} รายการ)</span>
                  </span>
                  <button
                    onClick={clearFilters}
                    className="text-rose-400 hover:underline font-bold"
                  >
                    ล้างการกรองทั้งหมด
                  </button>
                </div>
              )}
            </div>

            {/* TRANSACTIONS LIST */}
            {filteredTransactions.length === 0 ? (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-xs space-y-1">
                <p className="text-3xl">🐻</p>
                <p className="font-bold text-slate-300">ไม่พบรายการบันทึกที่ค้นหา</p>
                <p>ลองปรับคำค้นหา หรือล้างตัวกรองเพื่อดูรายการทั้งหมด</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
                {filteredTransactions.map(item => {
                  return (
                    <div
                      key={item.id}
                      className="bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between text-xs transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                          item.type === 'INCOME' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {item.categoryIcon || (item.type === 'INCOME' ? '💰' : '💸')}
                        </div>
                        <div>
                          <div className="font-bold text-slate-200 flex flex-wrap items-center gap-1.5">
                            <span className="text-sm">{item.note || item.category}</span>
                            <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                              {item.category}
                            </span>
                            {item.slipUrl && (
                              <button
                                type="button"
                                onClick={() => setViewingSlipUrl(item.slipUrl!)}
                                className="text-[10px] bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 px-2 py-0.5 rounded font-bold flex items-center space-x-1"
                              >
                                <Camera className="w-3 h-3" />
                                <span>ดูสลิป</span>
                              </button>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center space-x-2 mt-0.5">
                            <span>{formatThaiDate(item.date)}</span>
                            <span className="text-amber-400/80 italic">{item.bearMood}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className={`font-black text-base ${
                          item.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {item.type === 'INCOME' ? '+' : '-'}{formatTHB(item.amount)}
                        </span>
                        <button
                          onClick={() => onDeleteTransaction(item.id)}
                          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-xl transition-colors"
                          title="ลบรายการนี้"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* VIEW 2: INCOME & EXPENSE CALENDAR VIEW (ปฏิทินรายรับ-รายจ่าย) */}
      {activeTab === 'CALENDAR' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            
            {/* Calendar Header Month Controls */}
            <div className="flex flex-col  items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white flex items-center space-x-2">
                    <span>ปฏิทินสรุปรายรับ-รายจ่าย</span>
                    <span className="text-xs bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                      {THAI_MONTH_FULL[calMonth]} {calYear + 543}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">คลิกที่แต่ละวันบนปฏิทินเพื่อดูสรุปรายการในวันนั้นๆ</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleGoToToday}
                  className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all"
                >
                  วันนี้ ({today.getDate()} {THAI_MONTH_SHORT[today.getMonth()]})
                </button>
                <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    title="เดือนก่อนหน้า"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    title="เดือนถัดไป"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Calendar Month Summary Row */}
            {(() => {
              const currentMonthPrefix = `${calYear}-${(calMonth + 1).toString().padStart(2, '0')}`;
              const monthTransactions = myPersonalTransactions.filter(t => t.date && t.date.startsWith(currentMonthPrefix));
              const mIncome = monthTransactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + (t.amount || 0), 0);
              const mExpense = monthTransactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + (t.amount || 0), 0);

              return (
                <div className="grid grid-cols-3 gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs">
                  <div className="text-center">
                    <span className="text-slate-400 block">💰 รายรับเดือนนี้</span>
                    <span className="font-bold text-emerald-400 text-sm">{formatTHB(mIncome)}</span>
                  </div>
                  <div className="text-center border-x border-slate-800">
                    <span className="text-slate-400 block">💸 รายจ่ายเดือนนี้</span>
                    <span className="font-bold text-rose-400 text-sm">{formatTHB(mExpense)}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-slate-400 block">⚖️ ยอดสุทธิ</span>
                    <span className={`font-bold text-sm ${mIncome - mExpense >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                      {formatTHB(mIncome - mExpense)}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Calendar Grid Table */}
            <div className="grid grid-cols-7 gap-1.5  pt-2">
              {/* Day Headers */}
              {DAY_NAMES.map((d, idx) => (
                <div
                  key={d}
                  className={`text-center py-1.5 text-xs font-bold rounded-xl ${
                    idx === 0 ? 'text-rose-400 bg-rose-500/10' : idx === 6 ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400 bg-slate-950'
                  }`}
                >
                  {d}
                </div>
              ))}

              {/* Blank Offset Cells */}
              {Array.from({ length: startingDayOfWeek }).map((_, idx) => (
                <div key={`blank-${idx}`} className="bg-slate-950/40 rounded-2xl p-2 min-h-[70px]  opacity-20" />
              ))}

              {/* Days Cells */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const dateStr = `${calYear}-${(calMonth + 1).toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
                const dayTrans = dailyTransactionsMap[dateStr] || [];
                const dayInc = dayTrans.filter(t => t.type === 'INCOME').reduce((s, t) => s + (t.amount || 0), 0);
                const dayExp = dayTrans.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + (t.amount || 0), 0);

                const isToday = dateStr === todayIso;
                const isSelected = selectedCalDate === dateStr;

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedCalDate(dateStr)}
                    className={`rounded-2xl p-1.5  min-h-[75px]  flex flex-col justify-between text-left transition-all relative border ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 shadow-lg shadow-amber-500/10 scale-[1.02]'
                        : isToday
                        ? 'bg-slate-950 border-emerald-500/60 shadow-md'
                        : 'bg-slate-950 hover:bg-slate-850 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-xs font-black rounded-full px-1.5 py-0.5 ${
                        isToday ? 'bg-emerald-500 text-slate-950' : isSelected ? 'bg-amber-500 text-slate-950' : 'text-slate-300'
                      }`}>
                        {dayNum}
                      </span>
                      {dayTrans.length > 0 && (
                        <span className="text-[10px] text-amber-300 bg-amber-500/20 px-1 rounded-full font-bold">
                          {dayTrans.length}
                        </span>
                      )}
                    </div>

                    <div className="space-y-0.5 mt-1 w-full text-[10px]">
                      {dayInc > 0 && (
                        <div className="bg-emerald-500/20 text-emerald-300 font-bold px-1 rounded truncate">
                          +{formatTHB(dayInc)}
                        </div>
                      )}
                      {dayExp > 0 && (
                        <div className="bg-rose-500/20 text-rose-300 font-bold px-1 rounded truncate">
                          -{formatTHB(dayExp)}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Calendar Date Detailed Breakdown */}
            {selectedCalDate && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 mt-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-white">
                    <CalendarIcon className="w-4 h-4 text-amber-400" />
                    <span>รายการประจำวันที่ {formatThaiDate(selectedCalDate)}</span>
                  </div>
                  <button
                    onClick={() => setDate(selectedCalDate)}
                    className="text-[11px] text-amber-400 hover:underline font-bold"
                  >
                    + บันทึกรายการวันที่นี้
                  </button>
                </div>

                {(!dailyTransactionsMap[selectedCalDate] || dailyTransactionsMap[selectedCalDate].length === 0) ? (
                  <p className="text-xs text-slate-500 text-center py-3">ไม่มีรายการบันทึกในวันที่เลือก</p>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
                    {dailyTransactionsMap[selectedCalDate].map(item => (
                      <div
                        key={item.id}
                        className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center space-x-2.5">
                          <span className="text-lg">{item.categoryIcon || '📦'}</span>
                          <div>
                            <div className="font-bold text-slate-200">{item.note || item.category}</div>
                            <div className="text-[10px] text-slate-400">{item.category} • {item.bearMood}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`font-black ${item.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {item.type === 'INCOME' ? '+' : '-'}{formatTHB(item.amount)}
                          </span>
                          <button
                            onClick={() => onDeleteTransaction(item.id)}
                            className="text-slate-500 hover:text-rose-400"
                            title="ลบ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* VIEW 3: MONTHLY REPORT & BAR CHART */}
      {activeTab === 'REPORT' && (
        <div className="space-y-6">
          
          {/* Main Recharts Comparative Bar Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <BarChart2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-black text-white">
                  กราฟแท่งเปรียบเทียบ รายรับ VS รายจ่ายประจำเดือน (บัญชีส่วนตัว)
                </h3>
              </div>
              <span className="text-xs text-slate-400 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
                หน่วย: บาท (THB)
              </span>
            </div>

            {monthlyChartData.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                ยังไม่มีข้อมูลรายรับรายจ่ายเพียงพอสำหรับแสดงกราฟ
              </div>
            ) : (
              <div className="w-full h-72 pt-2">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={monthlyChartData} margin={{ top: 15, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="monthLabel"
                      stroke="#94a3b8"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
                      formatter={(value) => <span className="text-slate-200 font-bold">{value}</span>}
                    />
                    <Bar
                      dataKey="income"
                      name="💰 รายรับ (Income)"
                      fill="#10b981"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={45}
                    />
                    <Bar
                      dataKey="expense"
                      name="💸 รายจ่าย (Expense)"
                      fill="#f43f5e"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={45}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Breakdown & Bear Insights */}
          <div className="grid grid-cols-1  gap-6">
            
            {/* Category Progress Bars */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                <PieIcon className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-white">สัดส่วนรายจ่ายแยกตามหมวดหมู่</h4>
              </div>

              {categoryBreakdown.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">ไม่มีข้อมูลรายจ่าย</p>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                  {categoryBreakdown.map((item) => (
                    <div key={item.category} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-200 font-medium flex items-center space-x-2">
                          <span>{item.icon}</span>
                          <span>{item.category}</span>
                        </span>
                        <span className="font-bold text-slate-100">
                          {formatTHB(item.amount)} ({item.percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(item.percentage, 100)}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bear Mascot Advice */}
            <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-5 space-y-4 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold text-amber-400">พี่หมีวิเคราะห์การเงินประจำเดือน</h4>
                </div>

                <div className="mt-3 space-y-3 text-xs text-slate-300 leading-relaxed">
                  <p>
                    🐻 <strong className="text-white">ภาพรวม:</strong> มีรายรับรวม {formatTHB(totalIncome)} และรายจ่ายรวม {formatTHB(totalExpense)}
                  </p>

                  {categoryBreakdown.length > 0 && (
                    <p>
                      🍯 <strong className="text-amber-300">หมวดหมู่ใช้จ่ายสูงสุด:</strong> {categoryBreakdown[0].icon} {categoryBreakdown[0].category} ({formatTHB(categoryBreakdown[0].amount)})
                    </p>
                  )}

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-xs font-bold text-emerald-400 block">💡 คำแนะนำการเงินจากพี่หมี:</span>
                    <p className="text-xs text-slate-300 italic">
                      {netSavings > 0
                        ? 'ออมเงินได้ต่อเนื่องดีมากฮะ! ลองแบ่งเงินคงเหลือ 10-20% ไปออมในกองทุนหรือบัญชีดอกเบี้ยสูงดูนะฮะ 🐻'
                        : 'เดือนนี้รายจ่ายค่อนข้างตึงมือ ลองลดรายจ่ายหมวดหมู่ที่ไม่จำเป็นในเดือนถัดไปดูนะฮะ สู้ๆ ฮาดี้! 🐻‍❄️'}
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCopySummary}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-2xl transition-all shadow-lg mt-4 active:scale-95"
              >
                ส่งรายงานประจำเดือนเข้ากลุ่ม LINE 📲
              </button>
            </div>

          </div>

        </div>
      )}

      {/* SLIP / RECEIPT MODAL PREVIEW */}
      {viewingSlipUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-md w-full space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Camera className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">รูปภาพสลิป/ใบเสร็จที่แนบไว้</h3>
              </div>
              <button
                onClick={() => setViewingSlipUrl(null)}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-center bg-slate-950 p-2 rounded-2xl border border-slate-800 max-h-[70vh] overflow-auto">
              <img
                src={viewingSlipUrl}
                alt="Attached Slip"
                className="max-h-[60vh] object-contain rounded-xl"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setViewingSlipUrl(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

