import React, { useState } from 'react';
import { BearTransaction, Person } from '../types';
import { formatTHB, formatThaiDate } from '../utils/thaiFormatters';
import {
  X,
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
  Search,
  Filter,
  Calendar as CalendarIcon,
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

interface BearTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  people?: Person[];
  transactions?: BearTransaction[];
  selectedAccountId?: string;
  onSelectAccount?: (id: string) => void;
  onAddTransaction: (transaction: Omit<BearTransaction, 'id' | 'createdAt'>) => void;
  onDeleteTransaction: (id: string) => void;
}

export const EXPENSE_CATEGORIES = [
  { name: 'อาหาร & เครื่องดื่ม', icon: '🍔', mood: '🐻 อิ่มพุงกางเลยฮะ~', color: '#f43f5e' },
  { name: 'การเดินทาง / ค่าน้ำมัน', icon: '🚗', mood: '🛵 พี่หมีพาซิ่ง', color: '#fb923c' },
  { name: 'ช้อปปิ้ง / ของใช้', icon: '🛍️', mood: '📦 ของมันต้องมีฮะพี่หมี', color: '#facc15' },
  { name: 'ค่าบ้าน / คอนโด / หอพัก', icon: '🏠', mood: '🌲 จ่ายค่ารังนอนพี่หมี', color: '#a855f7' },
  { name: 'ค่าน้ำ / ค่าไฟ / อินเทอร์เน็ต', icon: '⚡', mood: '💡 ค่าไฟพุ่งกระฉูด', color: '#3b82f6' },
  { name: 'ความบันเทิง / เกม / ซีรีส์', icon: '🎬', mood: '🎮 พักผ่อนหย่อนใจ', color: '#ec4899' },
  { name: 'สุขภาพ / ยา / ทำฟัน', icon: '💊', mood: '🩺 สุขภาพแข็งแรงนะฮะ', color: '#14b8a6' },
  { name: 'ขนม / น้ำผึ้ง / ของกินเล่น', icon: '🍯', mood: '🍯 ซื้อน้ำผึ้งหวานเจี๊ยบให้พี่หมี!', color: '#10b981' },
  { name: 'อื่นๆ', icon: '📦', mood: '📝 พี่หมีบันทึกเรียบร้อยฮะ', color: '#64748b' },
];

export const INCOME_CATEGORIES = [
  { name: 'เงินเดือน / ค่าจ้าง', icon: '💰', mood: '🐻 เงินเดือนออกแล้ว เย้!' },
  { name: 'งานเสริม / ฟรีแลนซ์', icon: '💼', mood: '🚀 พี่หมีขยันจังฮู้!' },
  { name: 'โบนัส / เงินพิเศษ', icon: '🎁', mood: '🎉 เงินขวัญถุงปังๆ' },
  { name: 'การลงทุน / ปันผล', icon: '📈', mood: '🪙 ให้เงินทำงานแทนฮะ' },
  { name: 'ได้คืน / เพื่อนโอนคืน', icon: '🤝', mood: '🤝 ได้เงินคืนเรียบร้อย' },
  { name: 'อื่นๆ', icon: '🌟', mood: '✨ รายรับใหม่เข้ามาแล้ว' },
];

const THAI_MONTH_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const THAI_MONTH_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

const DAY_NAMES = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

export const BearTrackerModal: React.FC<BearTrackerModalProps> = ({
  isOpen,
  onClose,
  people = [],
  transactions = [],
  selectedAccountId = 'me',
  onSelectAccount,
  onAddTransaction,
  onDeleteTransaction,
}) => {
  const today = new Date();
  const todayIso = today.toISOString().split('T')[0];

  // Active view mode inside modal: RECORD vs CALENDAR vs REPORT
  const [activeTab, setActiveTab] = useState<'RECORD' | 'CALENDAR' | 'REPORT'>('RECORD');

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [filterType, setFilterType] = useState<'ALL' | 'EXPENSE' | 'INCOME'>('ALL');

  // Calendar States
  const [calYear, setCalYear] = useState<number>(today.getFullYear());
  const [calMonth, setCalMonth] = useState<number>(today.getMonth());
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

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      setAttachedSlipUrl(base64Data);
      setIsScanningSlip(true);
      setScanSuccessMsg(null);

      try {
        let res = await fetch('/api/gemini/scan-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64Data,
            mimeType: file.type || 'image/jpeg'
          })
        });

        let json = await res.json();

        if (!json.success || !json.data || !json.data.totalAmount) {
          res = await fetch('/api/gemini/scan-slip', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: base64Data,
              mimeType: file.type || 'image/jpeg'
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
    reader.readAsDataURL(file);
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

  if (!isOpen) return null;

  const safePeople = Array.isArray(people) ? people : [];
  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  // Primary user
  const meUser = safePeople.find(p => p.isMe) || safePeople[0] || { id: 'p_lek', name: 'ฉัน', isMe: true };

  // Filter transactions strictly for personal ledger
  const accountFilteredTransactions = safeTransactions.filter(t => {
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
  const currentMonthExpenseTotal = accountFilteredTransactions
    .filter(t => t.type === 'EXPENSE' && t.date && t.date.startsWith(currentMonthIsoPrefix))
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const budgetSpentPercentage = monthlyBudget > 0 ? (currentMonthExpenseTotal / monthlyBudget) * 100 : 0;
  const remainingBudget = monthlyBudget - currentMonthExpenseTotal;

  // Overall Stats
  const totalIncome = accountFilteredTransactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalExpense = accountFilteredTransactions
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

  // Search & Filtered History
  const filteredHistoryTransactions = accountFilteredTransactions.filter(t => {
    if (filterType === 'EXPENSE' && t.type !== 'EXPENSE') return false;
    if (filterType === 'INCOME' && t.type !== 'INCOME') return false;

    if (categoryFilter !== 'ALL' && t.category !== categoryFilter) return false;
    if (dateFilter && t.date !== dateFilter) return false;

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
  const startingDayOfWeek = firstDayOfMonth.getDay();
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

  const dailyTransactionsMap: Record<string, BearTransaction[]> = {};
  accountFilteredTransactions.forEach(t => {
    if (!t.date) return;
    if (!dailyTransactionsMap[t.date]) {
      dailyTransactionsMap[t.date] = [];
    }
    dailyTransactionsMap[t.date].push(t);
  });

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('ALL');
    setDateFilter('');
    setFilterType('ALL');
  };

  // Generate Monthly Aggregated Data for Recharts Bar Chart
  const monthlyChartData = (() => {
    const monthMap: Record<string, { income: number; expense: number }> = {};

    accountFilteredTransactions.forEach(t => {
      if (!t.date) return;
      const monthKey = t.date.slice(0, 7); // YYYY-MM
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

  // Expense Category Breakdown for Pie Chart / Progress List
  const categoryBreakdown = (() => {
    const catMap: Record<string, { amount: number; icon: string; color: string }> = {};

    accountFilteredTransactions
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

  // Handle Type Switch
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

  // Custom Recharts Tooltip Component
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
    <div className="fixed inset-0 z-50 flex items-start  justify-center p-2  bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl my-auto max-h-[92vh] flex flex-col">
        
        {/* Top Header */}
        <div className="bg-gradient-to-r from-amber-600/30 via-orange-600/20 to-amber-700/30 border-b border-slate-800 p-4  flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10   rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-2xl  shadow-inner shrink-0">
              🐻
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-1">
                <h2 className="text-base  font-black text-white tracking-tight">หมีจด (บัญชีส่วนตัว)</h2>
                <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full flex items-center space-x-1 shrink-0">
                  <span>🐻</span>
                  <span>สมุดบันทึกรับ-จ่าย</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                จัดการรายรับ-รายจ่ายของคุณ พร้อมดูสรุป
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-full transition-all shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Private Ledger Notice Badge */}
        <div className="bg-slate-950 px-4  py-2.5  border-b border-slate-800 flex items-center justify-between text-xs text-slate-300 shrink-0">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 rounded-lg font-bold border border-amber-500/30 shrink-0">
              🔒 บัญชีส่วนตัว
            </span>
            <span className="hidden ">บันทึกข้อมูลเฉพาะคุณ</span>
          </div>
        </div>

        {/* Navigation Tabs Mode: Record vs Calendar vs Monthly Report */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 p-2 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('RECORD')}
            className={`flex-1 py-2  rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'RECORD'
                ? 'bg-slate-800 text-amber-400 border border-amber-500/30 shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Plus className="w-4 h-4 text-amber-400 shrink-0" />
            <span>📝 จดบันทึก & ค้นหา</span>
          </button>

          <button
            onClick={() => setActiveTab('CALENDAR')}
            className={`flex-1 py-2  rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'CALENDAR'
                ? 'bg-slate-800 text-amber-400 border border-amber-500/30 shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <CalendarIcon className="w-4 h-4 text-amber-400 shrink-0" />
            <span>📅 ปฏิทินรายรับ-รายจ่าย</span>
          </button>

          <button
            onClick={() => setActiveTab('REPORT')}
            className={`flex-1 py-2  rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'REPORT'
                ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30 shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <BarChart2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>📊 รายงานสรุปประจำเดือน</span>
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="p-4  space-y-6 overflow-y-auto flex-1 custom-scrollbar min-h-0">
          
          {/* Top Summary Banner */}
          <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-4 relative overflow-hidden">
            <div className="flex flex-col  items-start  justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="text-4xl animate-bounce">
                  {netSavings >= 0 ? '🐻' : '🐻‍❄️'}
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-400 flex items-center space-x-1">
                    <span>พี่หมีสรุปบัญชีส่วนตัว:</span>
                  </div>
                  <p className="text-xs text-slate-200 mt-0.5 font-medium">
                    {netSavings > 5000
                      ? '🐻 "เดือนนี้เก็บเงินยอดเยี่ยมมากฮะ! มีเงินเหลือซื้อน้ำผึ้งฉ่ำๆ ให้พี่หมีเพียบ"'
                      : netSavings >= 0
                      ? '🐻 "ยอดเงินสุทธิยังเป็นบวก สู้ๆ นะฮะ พี่หมีช่วยดูแลบัญชีเต็มที่!"'
                      : '🐻‍❄️ "งือ... รายจ่ายรวมสูงกว่ารายรับนิดหน่อย ต้องลองวางแผนควบคุมรายจ่ายดูนะฮะ"'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleCopySummary}
                className="px-3 py-1.5 bg-slate-800 hover:bg-amber-950 hover:text-amber-300 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 flex items-center space-x-1.5 transition-all self-end "
              >
                {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
                <span>{copiedSummary ? 'คัดลอกแล้ว!' : 'คัดลอกสรุปบัญชี'}</span>
              </button>
            </div>

            {/* Financial Totals */}
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-800">
              <div className="bg-slate-900/90 p-3 rounded-xl border border-emerald-500/30 text-center">
                <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center justify-center space-x-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>รายรับรวม</span>
                </div>
                <div className="text-base font-black text-emerald-400 mt-1">
                  {formatTHB(totalIncome)}
                </div>
              </div>

              <div className="bg-slate-900/90 p-3 rounded-xl border border-rose-500/30 text-center">
                <div className="text-[10px] text-rose-400 font-bold uppercase tracking-wider flex items-center justify-center space-x-1">
                  <TrendingDown className="w-3 h-3" />
                  <span>รายจ่ายรวม</span>
                </div>
                <div className="text-base font-black text-rose-400 mt-1">
                  {formatTHB(totalExpense)}
                </div>
              </div>

              <div className="bg-slate-900/90 p-3 rounded-xl border border-amber-500/30 text-center">
                <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center justify-center space-x-1">
                  <Wallet className="w-3 h-3" />
                  <span>คงเหลือสุทธิ</span>
                </div>
                <div className={`text-base font-black mt-1 ${netSavings >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {formatTHB(netSavings)}
                </div>
              </div>
            </div>

            {/* Monthly Budget Tracker inside Modal Banner */}
            <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-slate-200">งบประมาณรายเดือน (Monthly Budget)</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 text-amber-300 border border-slate-700">
                    {THAI_MONTH_FULL[today.getMonth()]} {today.getFullYear() + 543}
                  </span>
                </div>

                <button
                  onClick={handleOpenEditBudget}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-amber-300 text-[11px] font-bold rounded-lg border border-amber-500/30 flex items-center space-x-1"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>ตั้งงบ ({formatTHB(monthlyBudget)})</span>
                </button>
              </div>

              {isEditingBudget && (
                <form onSubmit={handleSaveBudget} className="bg-slate-900 border border-amber-500/40 p-3 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 flex items-center space-x-1">
                      <Sliders className="w-3 h-3" />
                      <span>กำหนดวงเงินงบประมาณรายเดือน</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsEditingBudget(false)}
                      className="text-slate-400 hover:text-white text-xs"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      placeholder="เช่น 15000"
                      value={inputBudgetValue}
                      onChange={e => setInputBudgetValue(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold outline-none"
                      min="0"
                      step="any"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shrink-0"
                    >
                      บันทึก
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-1 pt-1">
                    <span className="text-[10px] text-slate-400">เลือกด่วน:</span>
                    {[5000, 10000, 15000, 20000, 30000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setInputBudgetValue(amt.toString())}
                        className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-300 text-[10px] font-bold rounded"
                      >
                        {formatTHB(amt)}
                      </button>
                    ))}
                  </div>
                </form>
              )}

              {/* Progress Bar & Percentage */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-slate-400">ใช้จ่ายเดือนนี้: {formatTHB(currentMonthExpenseTotal)} / {formatTHB(monthlyBudget)}</span>
                  <span className={
                    budgetSpentPercentage > 100 ? 'text-rose-400' :
                    budgetSpentPercentage >= 90 ? 'text-rose-300' :
                    budgetSpentPercentage >= 70 ? 'text-amber-400' : 'text-emerald-400'
                  }>
                    {budgetSpentPercentage.toFixed(1)}% {budgetSpentPercentage > 100 ? '🚨 เกินงบ!' : ''}
                  </span>
                </div>

                <div className="w-full bg-slate-900 h-2.5 rounded-full border border-slate-800 overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      budgetSpentPercentage > 100
                        ? 'bg-rose-500 animate-pulse'
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

              {/* Warning Alert Banner */}
              <div className={`p-2.5 rounded-xl border text-[11px] font-medium flex items-center space-x-2 ${
                budgetSpentPercentage > 100
                  ? 'bg-rose-950/80 border-rose-500/50 text-rose-200'
                  : budgetSpentPercentage >= 90
                  ? 'bg-orange-950/80 border-orange-500/50 text-orange-200'
                  : budgetSpentPercentage >= 70
                  ? 'bg-amber-950/70 border-amber-500/40 text-amber-200'
                  : 'bg-emerald-950/60 border-emerald-500/30 text-emerald-200'
              }`}>
                <span>{budgetSpentPercentage > 100 ? '🚨' : budgetSpentPercentage >= 90 ? '⚠️' : budgetSpentPercentage >= 70 ? '💡' : '✨'}</span>
                <div>
                  <span className="font-bold">
                    {budgetSpentPercentage > 100
                      ? `เกินงบประมาณ ${formatTHB(Math.abs(remainingBudget))} แล้วนะฮะ!`
                      : budgetSpentPercentage >= 90
                      ? `ใช้ไป ${budgetSpentPercentage.toFixed(1)}% ของงบแล้ว เหลือสั่งจ่ายได้อีก ${formatTHB(remainingBudget)}`
                      : budgetSpentPercentage >= 70
                      ? `ใช้ไป ${budgetSpentPercentage.toFixed(1)}% ของงบแล้ว ระวังค่าใช้จ่ายปลายเดือนนะฮะ`
                      : `ใช้ไป ${budgetSpentPercentage.toFixed(1)}% เหลืองบสั่งจ่ายอีก ${formatTHB(remainingBudget)}`}
                  </span>
                </div>
              </div>

              {/* Savings Goal Section inside Modal Banner */}
              <div className="pt-3 border-t border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <PiggyBank className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-slate-200">เป้าหมายการออมเงิน (Savings Goal)</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {savingsGoalTitle}
                    </span>
                  </div>

                  <button
                    onClick={handleOpenEditSavingsGoal}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-emerald-300 text-[11px] font-bold rounded-lg border border-emerald-500/30 flex items-center space-x-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>ตั้งเป้า ({formatTHB(savingsGoalTarget)})</span>
                  </button>
                </div>

                {isEditingSavingsGoal && (
                  <form onSubmit={handleSaveSavingsGoal} className="bg-slate-900 border border-emerald-500/40 p-3 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-400 flex items-center space-x-1">
                        <PiggyBank className="w-3.5 h-3.5" />
                        <span>กำหนดเป้าหมายออมเงินใหม่</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsEditingSavingsGoal(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1  gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold block mb-0.5">ชื่อเป้าหมาย</label>
                        <input
                          type="text"
                          placeholder="ออมเงินเที่ยวญี่ปุ่น 🇯🇵"
                          value={inputGoalTitle}
                          onChange={e => setInputGoalTitle(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold block mb-0.5">เป้าหมาย (บาท)</label>
                        <input
                          type="number"
                          placeholder="50000"
                          value={inputGoalTarget}
                          onChange={e => setInputGoalTarget(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-bold outline-none"
                          min="0"
                          step="any"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-1">
                      <button
                        type="submit"
                        className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg"
                      >
                        บันทึก
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingSavingsGoal(false)}
                        className="px-2.5 py-1 bg-slate-800 text-slate-300 font-medium text-xs rounded-lg"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </form>
                )}

                {/* Savings Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-300">ความคืบหน้า: {formatTHB(currentSavingsAmount)} / {formatTHB(savingsGoalTarget)}</span>
                    <span className={
                      savingsProgressPercentage >= 100 ? 'text-amber-300 animate-pulse font-black' :
                      savingsProgressPercentage >= 75 ? 'text-emerald-300' :
                      savingsProgressPercentage >= 50 ? 'text-teal-300' : 'text-cyan-300'
                    }>
                      {savingsProgressPercentage.toFixed(1)}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-900 h-3 rounded-full border border-slate-800 overflow-hidden relative p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        savingsProgressPercentage >= 100
                          ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 animate-pulse'
                          : savingsProgressPercentage >= 75
                          ? 'bg-gradient-to-r from-orange-400 via-amber-400 to-emerald-400'
                          : savingsProgressPercentage >= 50
                          ? 'bg-gradient-to-r from-teal-400 to-emerald-400'
                          : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                      }`}
                      style={{ width: `${Math.min(savingsProgressPercentage, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-semibold text-slate-300 flex items-center space-x-2">
                  <span>{savingsProgressPercentage >= 100 ? '🏆' : savingsProgressPercentage >= 75 ? '💎' : savingsProgressPercentage >= 50 ? '🚀' : '🐻'}</span>
                  <span>
                    {savingsProgressPercentage >= 100
                      ? `🎉 สำเร็จแล้ว! คุณออมเงินครบ ${formatTHB(savingsGoalTarget)} บรรลุเป้าหมาย "${savingsGoalTitle}" เรียบร้อยแล้ว!`
                      : savingsProgressPercentage >= 75
                      ? `อีกแค่ฮึบเดียว! สะสมได้ ${formatTHB(currentSavingsAmount)} (${savingsProgressPercentage.toFixed(1)}%) ขาดอีกเพียง ${formatTHB(savingsRemainingAmount)}`
                      : savingsProgressPercentage >= 50
                      ? `ผ่านครึ่งทางแล้ว! สะสมได้ ${formatTHB(currentSavingsAmount)} (${savingsProgressPercentage.toFixed(1)}%) เก่งมากครับ!`
                      : `สะสมได้แล้ว ${formatTHB(currentSavingsAmount)} (${savingsProgressPercentage.toFixed(1)}%) ขาดอีก ${formatTHB(savingsRemainingAmount)} สู้ๆ นะฮะ`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* TAB 1: RECORD & HISTORY */}
          {activeTab === 'RECORD' && (
            <div className="space-y-6">
              
              {/* Quick Record Form */}
              <form onSubmit={handleSubmit} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                    <Plus className="w-4 h-4 text-amber-400" />
                    <span>จดรายการใหม่ (บัญชีส่วนตัว)</span>
                  </h3>

                  {/* Expense vs Income Toggle */}
                  <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleTypeChange('EXPENSE')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        type === 'EXPENSE'
                          ? 'bg-rose-500 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      💸 รายจ่าย
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTypeChange('INCOME')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        type === 'INCOME'
                          ? 'bg-emerald-500 text-slate-950 shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      💰 รายรับ
                    </button>
                  </div>
                </div>

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

                {/* Categories Selector Grid */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-300">
                    เลือกหมวดหมู่ ({type === 'EXPENSE' ? 'รายจ่าย' : 'รายรับ'}):
                  </label>
                  <div className="grid grid-cols-3  gap-2">
                    {(type === 'EXPENSE' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(cat => {
                      const isSelected = selectedCategory === cat.name;
                      return (
                        <button
                          key={cat.name}
                          type="button"
                          onClick={() => handleSelectCategory(cat.name, cat.icon, cat.mood)}
                          className={`p-2 rounded-xl text-center border transition-all flex flex-col items-center justify-center space-y-1 ${
                            isSelected
                              ? type === 'EXPENSE'
                                ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold'
                                : 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <span className="text-lg">{cat.icon}</span>
                          <span className="text-[10px] leading-tight text-center line-clamp-1">{cat.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Inputs: Amount, Date, Note */}
                <div className="grid grid-cols-1  gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">จำนวนเงิน (บาท)</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      placeholder="0.00"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-white font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">วันที่</label>
                    <input
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">บันทึกเพิ่มเติม</label>
                    <input
                      type="text"
                      placeholder="เช่น ค่ากาแฟ, ค่าหอพัก..."
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                  </div>
                </div>

                {/* Bear Comment Preview */}
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 flex items-center justify-between text-xs text-amber-300">
                  <span className="font-semibold flex items-center space-x-1">
                    <span>💬 ความเห็นพี่หมี:</span>
                    <span className="font-normal italic text-slate-200">{bearMood}</span>
                  </span>
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded-xl text-xs font-bold text-slate-950 flex items-center space-x-1.5 shadow-md active:scale-95 transition-all ${
                      type === 'EXPENSE' ? 'bg-amber-400 hover:bg-amber-300' : 'bg-emerald-400 hover:bg-emerald-300'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>บันทึกหมีจด 🐻</span>
                  </button>
                </div>
              </form>

              {/* SEARCH & FILTERS BAR */}
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
                  {/* Category Filter */}
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

                  {/* Date Filter */}
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

                {/* Filter info badge */}
                {(searchQuery || categoryFilter !== 'ALL' || dateFilter || filterType !== 'ALL') && (
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
                    <span className="text-amber-400 font-semibold flex items-center space-x-1">
                      <ListFilter className="w-3 h-3" />
                      <span>กำลังกรองข้อมูล (พบ {filteredHistoryTransactions.length} รายการ)</span>
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

              {/* Transaction History Listing */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white flex items-center space-x-2">
                    <span>ประวัติรายการบัญชี ({filteredHistoryTransactions.length} รายการ)</span>
                  </h3>

                  {/* Filter Tabs */}
                  <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
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

                {filteredHistoryTransactions.length === 0 ? (
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 text-xs">
                    <p className="text-2xl mb-1">🐻</p>
                    <p>ยังไม่มีรายการบันทึกในบัญชีนี้ เริ่มจดรายการแรกกับพี่หมีได้เลยฮะ!</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                    {filteredHistoryTransactions.map(item => {
                      const personOwner = safePeople.find(p => p.id === item.personId);

                      return (
                        <div
                          key={item.id}
                          className="bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-2xl p-3 flex items-center justify-between text-xs transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${
                              item.type === 'INCOME' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                            }`}>
                              {item.categoryIcon || (item.type === 'INCOME' ? '💰' : '💸')}
                            </div>
                            <div>
                              <div className="font-bold text-slate-200 flex flex-wrap items-center gap-1.5">
                                <span>{item.note || item.category}</span>
                                <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.2 rounded border border-slate-800">
                                  {item.category}
                                </span>
                                {item.slipUrl && (
                                  <button
                                    type="button"
                                    onClick={() => setViewingSlipUrl(item.slipUrl!)}
                                    className="text-[10px] bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 px-1.5 py-0.5 rounded font-bold flex items-center space-x-1"
                                  >
                                    <Camera className="w-3 h-3" />
                                    <span>ดูสลิป</span>
                                  </button>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 flex items-center space-x-2 mt-0.5">
                                <span>{formatThaiDate(item.date)}</span>
                                <span className="text-amber-400/80 italic">{item.bearMood}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-3">
                            <span className={`font-black text-sm ${
                              item.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'
                            }`}>
                              {item.type === 'INCOME' ? '+' : '-'}{formatTHB(item.amount)}
                            </span>
                            <button
                              onClick={() => onDeleteTransaction(item.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors"
                              title="ลบรายการนี้"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

          {/* TAB 2: CALENDAR VIEW */}
          {activeTab === 'CALENDAR' && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <CalendarIcon className="w-4 h-4 text-amber-400" />
                    <h3 className="text-xs font-bold text-white">
                      ปฏิทินสรุปรายรับ-รายจ่าย ({THAI_MONTH_FULL[calMonth]} {calYear + 543})
                    </h3>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={handleGoToToday}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-bold"
                    >
                      วันนี้
                    </button>
                    <button
                      onClick={handlePrevMonth}
                      className="p-1 text-slate-400 hover:text-white"
                      title="เดือนก่อนหน้า"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleNextMonth}
                      className="p-1 text-slate-400 hover:text-white"
                      title="เดือนถัดไป"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 text-xs">
                  {DAY_NAMES.map((d, idx) => (
                    <div
                      key={d}
                      className={`text-center py-1 font-bold text-[11px] rounded ${
                        idx === 0 ? 'text-rose-400' : idx === 6 ? 'text-amber-400' : 'text-slate-400'
                      }`}
                    >
                      {d}
                    </div>
                  ))}

                  {Array.from({ length: startingDayOfWeek }).map((_, idx) => (
                    <div key={`b-${idx}`} className="p-1 min-h-[50px] opacity-20" />
                  ))}

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
                        className={`rounded-xl p-1 min-h-[55px] flex flex-col justify-between text-left transition-all border ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400'
                            : isToday
                            ? 'bg-slate-900 border-emerald-500/60'
                            : 'bg-slate-900 hover:bg-slate-800 border-slate-800'
                        }`}
                      >
                        <span className={`text-[10px] font-bold px-1 rounded-full w-fit ${
                          isToday ? 'bg-emerald-500 text-slate-950' : 'text-slate-300'
                        }`}>
                          {dayNum}
                        </span>

                        <div className="space-y-0.5 text-[9px] font-bold">
                          {dayInc > 0 && <div className="text-emerald-400 truncate">+{formatTHB(dayInc)}</div>}
                          {dayExp > 0 && <div className="text-rose-400 truncate">-{formatTHB(dayExp)}</div>}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Date Details */}
                {selectedCalDate && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2 mt-2 text-xs">
                    <div className="font-bold text-white flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <span>🗓️ รายการวันที่ {formatThaiDate(selectedCalDate)}</span>
                      <button
                        onClick={() => { setDate(selectedCalDate); setActiveTab('RECORD'); }}
                        className="text-amber-400 text-[10px] hover:underline"
                      >
                        + จดในวันที่นี้
                      </button>
                    </div>

                    {(!dailyTransactionsMap[selectedCalDate] || dailyTransactionsMap[selectedCalDate].length === 0) ? (
                      <p className="text-[11px] text-slate-500 text-center py-2">ไม่มีรายการบันทึกในวันที่เลือก</p>
                    ) : (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                        {dailyTransactionsMap[selectedCalDate].map(item => (
                          <div key={item.id} className="bg-slate-950 p-2 rounded-lg flex items-center justify-between text-[11px]">
                            <div className="flex items-center space-x-2">
                              <span>{item.categoryIcon || '📦'}</span>
                              <span className="font-semibold text-slate-200">{item.note || item.category}</span>
                            </div>
                            <span className={`font-bold ${item.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {item.type === 'INCOME' ? '+' : '-'}{formatTHB(item.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MONTHLY REPORT & BAR CHART (Recharts) */}
          {activeTab === 'REPORT' && (
            <div className="space-y-6">
              
              {/* Main Recharts Comparative Bar Chart */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center space-x-2">
                    <BarChart2 className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-bold text-white">
                      กราฟแท่งเปรียบเทียบ รายรับ VS รายจ่ายประจำเดือน (บัญชีส่วนตัว)
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-800">
                    หน่วย: บาท (THB)
                  </span>
                </div>

                {monthlyChartData.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    ยังไม่มีข้อมูลรายรับรายจ่ายเพียงพอสำหรับแสดงกราฟ
                  </div>
                ) : (
                  <div className="w-full h-64 pt-2 min-h-[250px]">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={monthlyChartData} margin={{ top: 15, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis
                          dataKey="monthLabel"
                          stroke="#94a3b8"
                          tick={{ fontSize: 11 }}
                        />
                        <YAxis
                          stroke="#94a3b8"
                          tick={{ fontSize: 10 }}
                          tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                          wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }}
                          formatter={(value) => <span className="text-slate-300 font-semibold">{value}</span>}
                        />
                        <Bar
                          dataKey="income"
                          name="💰 รายรับ (Income)"
                          fill="#10b981"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={40}
                        />
                        <Bar
                          dataKey="expense"
                          name="💸 รายจ่าย (Expense)"
                          fill="#f43f5e"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={40}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Expense Category Distribution Breakdown */}
              <div className="grid grid-cols-1  gap-4">
                
                {/* Category Progress Bars */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
                    <PieIcon className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-bold text-white">สัดส่วนรายจ่ายแยกตามหมวดหมู่</h4>
                  </div>

                  {categoryBreakdown.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">ไม่มีข้อมูลรายจ่าย</p>
                  ) : (
                    <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
                      {categoryBreakdown.map((item) => (
                        <div key={item.category} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-300 font-medium flex items-center space-x-1.5">
                              <span>{item.icon}</span>
                              <span>{item.category}</span>
                            </span>
                            <span className="font-bold text-slate-200">
                              {formatTHB(item.amount)} ({item.percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
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

                {/* Bear Mascot Monthly Health Advice */}
                <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-bold text-amber-400">พี่หมีวิเคราะห์การเงินประจำเดือน</h4>
                    </div>

                    <div className="mt-3 space-y-2 text-xs text-slate-300">
                      <p className="leading-relaxed">
                        🐻 <strong className="text-white">ภาพรวม:</strong> มีรายรับรวม {formatTHB(totalIncome)} และรายจ่ายรวม {formatTHB(totalExpense)}
                      </p>

                      {categoryBreakdown.length > 0 && (
                        <p className="leading-relaxed">
                          🍯 <strong className="text-amber-300">หมวดหมู่ใช้จ่ายสูงสุด:</strong> {categoryBreakdown[0].icon} {categoryBreakdown[0].category} ({formatTHB(categoryBreakdown[0].amount)})
                        </p>
                      )}

                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 mt-2 space-y-1">
                        <span className="text-[11px] font-bold text-emerald-400 block">💡 ข้อแนะนำจากพี่หมี:</span>
                        <p className="text-[11px] text-slate-300 italic">
                          {netSavings > 0
                            ? 'ออมเงินได้ต่อเนื่องดีมากฮะ! ลองแบ่งเงินคงเหลือ 10-20% ไปออมในกองทุนหรือบัญชีดอกเบี้ยสูงดูนะฮะ 🐻'
                            : 'เดือนนี้รายจ่ายค่อนข้างตึงมือ ลองลดรายจ่ายหมวดหมู่ที่ไม่จำเป็นในเดือนถัดไปดูนะฮะ สู้ๆ ฮาดี้! 🐻‍❄️'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleCopySummary}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow mt-2"
                  >
                    ส่งรายงานประจำเดือนเข้ากลุ่ม LINE 📲
                  </button>
                </div>

              </div>

            </div>
          )}

        </div>

      </div>

      {/* SLIP / RECEIPT MODAL PREVIEW */}
      {viewingSlipUrl && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-3xl w-full space-y-4 shadow-2xl relative">
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
