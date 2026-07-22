export type SplitMethod = 'EQUAL' | 'EXACT' | 'ITEMIZED' | 'INSTALLMENT';

export type PaymentStatus = 'UNPAID' | 'PENDING_SLIP' | 'PAID' | 'REJECTED';

export type BillCategory = 'FOOD' | 'TRAVEL' | 'RENT' | 'UTILITIES' | 'SHOPPING' | 'ENTERTAINMENT' | 'OTHER';

export interface Person {
  id: string;
  name: string;
  avatarColor: string;
  phone?: string;
  promptPay?: string;
  lineId?: string;
  email?: string;
  avatarUrl?: string;
  isMe?: boolean;
}

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  locale?: string;
  accessToken?: string;
}

export interface BillParticipant {
  personId: string;
  amount: number;
  status: PaymentStatus;
  paidAt?: string;
  slipUrl?: string;
  slipNotes?: string;
  reminderCount?: number;
  lastRemindedAt?: string;
}

export interface BillItem {
  id: string;
  name: string;
  price: number;
  assignedPersonIds: string[];
}

export interface DailyScheduleItem {
  dayIndex: number;      // งวดที่ / วันที่ 1, 2, 3...
  date: string;          // YYYY-MM-DD
  amount: number;        // ยอดต่อวัน/งวด
  isPaid?: boolean;
  paidAt?: string;
  note?: string;
}

export interface InstallmentConfig {
  isInstallment: boolean;
  totalInstallments: number;                     // จำนวนงวด (เช่น 5, 10, 30 งวด/วัน)
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';     // ความถี่: 'DAILY' = แยกวันต่อวัน
  installmentAmountPerPerson: number;           // ยอดต่อคนต่องวด
  dailySchedule?: DailyScheduleItem[];           // ตารางแจกแจงวันต่อวัน
  generateSeparateBills?: boolean;               // สร้างบิลแยกตามวัน/งวดทันที
}

export interface Bill {
  id: string;
  title: string;
  category: BillCategory;
  creatorId: string; // 'ME' or personId
  totalAmount: number;
  createdAt: string;
  dueDate: string; // ISO date format string YYYY-MM-DD
  splitMethod: SplitMethod;
  participants: BillParticipant[];
  items?: BillItem[];
  note?: string;
  receiptImageUrl?: string;
  isCompleted: boolean;
  installmentConfig?: InstallmentConfig;
}

export interface LineConfig {
  notifyToken: string;
  enabledAutoReminder: boolean;
  reminderHour: number; // 0-23
  appUrl?: string;
}

export interface PromptPayConfig {
  type: 'PHONE' | 'NATIONAL_ID';
  target: string;
  name: string;
}

export interface IndividualSummaryItem {
  person: Person;
  totalOwedToMe: number; // ยอดที่เขาติดเรา
  totalIOweThem: number; // ยอดที่เราติดเขา
  netBalance: number;    // > 0 = เขาติดเรา, < 0 = เราติดเขา
  unpaidBills: {
    bill: Bill;
    participant: BillParticipant;
    isIOweThem: boolean;
  }[];
}

export interface LineNotificationLog {
  id: string;
  timestamp: string;
  recipientName: string;
  billTitle: string;
  amount: number;
  status: 'SUCCESS' | 'FAILED' | 'SIMULATED';
  message: string;
}

export interface BearTransaction {
  id: string;
  personId?: string; // Associated person account ID
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  category: string;
  categoryIcon: string;
  date: string; // YYYY-MM-DD
  note: string;
  bearMood: string;
  slipUrl?: string; // Attached slip or receipt photo URL
  createdAt: string;
}

// Compatibility alias
export type MeowTransaction = BearTransaction;

export interface SettlementReceipt {
  id: string;
  personName: string;
  settledAmount: number;
  settledAt: string;
  billsCount: number;
  note?: string;
}
