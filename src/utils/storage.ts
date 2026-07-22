import { Bill, Person, LineConfig, PromptPayConfig, LineNotificationLog } from '../types';

const STORAGE_KEYS = {
  BILLS: 'khunthong_bills_v6',
  PEOPLE: 'khunthong_people_v5',
  LINE_CONFIG: 'khunthong_line_config_v1',
  PROMPTPAY_CONFIG: 'khunthong_promptpay_config_v2',
  NOTIFICATION_LOGS: 'khunthong_notification_logs_v1',
};

// Default clean initial user (No sample friends)
export const INITIAL_PEOPLE: Person[] = [
  { id: 'me', name: 'ตัวฉัน (ผู้ใช้งาน)', avatarColor: 'bg-emerald-500', phone: '', isMe: true },
];

export const DEMO_PEOPLE: Person[] = [
  { id: 'me', name: 'ตัวฉัน (ผู้ใช้งาน)', avatarColor: 'bg-emerald-500', phone: '0819998888', isMe: true },
  { id: 'p_lek', name: 'เล็ก (ผู้รับเงิน / เจ้าหนี้)', avatarColor: 'bg-blue-500', phone: '0822223333', lineId: '@lek_line' },
  { id: 'p_aung', name: 'เอิง', avatarColor: 'bg-purple-500', phone: '0811112222', lineId: '@aung_line' },
  { id: 'p_ying', name: 'หญิง', avatarColor: 'bg-pink-500', phone: '0833334444', lineId: '@ying_line' },
  { id: 'p_jin', name: 'จิน', avatarColor: 'bg-amber-500', phone: '0844445555', lineId: '@jin_line' },
];

// Clean initial PromptPay configuration
export const INITIAL_PROMPTPAY: PromptPayConfig = {
  type: 'PHONE',
  target: '',
  name: '',
};

export const DEMO_PROMPTPAY: PromptPayConfig = {
  type: 'PHONE',
  target: '0822223333',
  name: 'เล็ก (บัญชีรับเงิน)',
};

export const INITIAL_LINE_CONFIG: LineConfig = {
  notifyToken: '',
  enabledAutoReminder: true,
  reminderHour: 9,
  appUrl: 'https://www.bearpay-app.com',
};

// Generate today & upcoming / past dates
const today = new Date();
const formatDateIso = (d: Date) => d.toISOString().split('T')[0];

const dateToday = formatDateIso(today);
const dateYesterday = formatDateIso(new Date(today.getTime() - 86400000 * 2));
const dateIn30Days = formatDateIso(new Date(today.getTime() + 86400000 * 30));

// Default clean initial bills (0 bills)
export const INITIAL_BILLS: Bill[] = [];

// Demo bills for optional sample data restore
export const DEMO_BILLS: Bill[] = [
  {
    id: 'b_daily_sample',
    title: 'ค่าอาหารและกิจกรรมผ่อนชำระ - แยกวันต่อวัน (5 วัน)',
    category: 'FOOD',
    creatorId: 'p_lek',
    totalAmount: 1500,
    createdAt: dateToday,
    dueDate: dateToday,
    splitMethod: 'INSTALLMENT',
    note: 'บิลผ่อนชำระแยกวันต่อวัน ยอดผ่อนวันละ 100 บาท/คน (ผ่อน 5 วัน)',
    isCompleted: false,
    installmentConfig: {
      isInstallment: true,
      totalInstallments: 5,
      frequency: 'DAILY',
      installmentAmountPerPerson: 100,
      dailySchedule: [
        { dayIndex: 1, date: dateToday, amount: 100, isPaid: false },
        { dayIndex: 2, date: formatDateIso(new Date(today.getTime() + 86400000 * 1)), amount: 100, isPaid: false },
        { dayIndex: 3, date: formatDateIso(new Date(today.getTime() + 86400000 * 2)), amount: 100, isPaid: false },
        { dayIndex: 4, date: formatDateIso(new Date(today.getTime() + 86400000 * 3)), amount: 100, isPaid: false },
        { dayIndex: 5, date: formatDateIso(new Date(today.getTime() + 86400000 * 4)), amount: 100, isPaid: false },
      ],
    },
    participants: [
      { personId: 'p_aung', amount: 500, status: 'UNPAID', reminderCount: 0 },
      { personId: 'p_ying', amount: 500, status: 'UNPAID', reminderCount: 0 },
      { personId: 'p_jin', amount: 500, status: 'UNPAID', reminderCount: 0 },
    ],
  },
  {
    id: 'b_monthly_1',
    title: 'ค่าเดินทางผ่อนชำระประจำเดือน - โอนให้เล็ก (งวดที่ 1/10)',
    category: 'TRAVEL',
    creatorId: 'p_lek',
    totalAmount: 2639.74,
    createdAt: dateToday,
    dueDate: dateIn30Days,
    splitMethod: 'EXACT',
    note: 'เล็กเป็นผู้สำรองจ่าย/รับเงิน | เอิง & หญิง ผ่อนคนละ 1,091.29 บาท/เดือน | จิน ผ่อน 457.16 บาท/เดือน',
    isCompleted: false,
    participants: [
      { personId: 'p_aung', amount: 1091.29, status: 'UNPAID', reminderCount: 0 },
      { personId: 'p_ying', amount: 1091.29, status: 'UNPAID', reminderCount: 0 },
      { personId: 'p_jin', amount: 457.16, status: 'UNPAID', reminderCount: 0 },
    ],
  },
  {
    id: 'b_go',
    title: 'ค่าเดินทาง - ขาไป (ยอดผ่อนรวม 10 งวด โอนให้เล็ก)',
    category: 'TRAVEL',
    creatorId: 'p_lek',
    totalAmount: 13714.80,
    createdAt: dateYesterday,
    dueDate: dateIn30Days,
    splitMethod: 'EQUAL',
    note: 'เล็กเป็นผู้สำรองจ่าย | สมาชิก 3 คน ผ่อนชำระให้เล็กคนละ 457.16 บาท/เดือน รวม 10 งวด',
    isCompleted: false,
    participants: [
      { personId: 'p_aung', amount: 4571.60, status: 'UNPAID', reminderCount: 0 },
      { personId: 'p_ying', amount: 4571.60, status: 'UNPAID', reminderCount: 0 },
      { personId: 'p_jin', amount: 4571.60, status: 'UNPAID', reminderCount: 0 },
    ],
  },
];

export function getStoredBills(): Bill[] {
  const data = localStorage.getItem(STORAGE_KEYS.BILLS);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(INITIAL_BILLS));
    return INITIAL_BILLS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_BILLS;
  }
}

export function saveBills(bills: Bill[]): void {
  localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(bills));
}

export function getStoredPeople(): Person[] {
  const data = localStorage.getItem(STORAGE_KEYS.PEOPLE);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.PEOPLE, JSON.stringify(INITIAL_PEOPLE));
    return INITIAL_PEOPLE;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_PEOPLE;
  }
}

export function savePeople(people: Person[]): void {
  localStorage.setItem(STORAGE_KEYS.PEOPLE, JSON.stringify(people));
}

export function getStoredLineConfig(): LineConfig {
  const data = localStorage.getItem(STORAGE_KEYS.LINE_CONFIG);
  if (!data) return INITIAL_LINE_CONFIG;
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_LINE_CONFIG;
  }
}

export function saveLineConfig(config: LineConfig): void {
  localStorage.setItem(STORAGE_KEYS.LINE_CONFIG, JSON.stringify(config));
}

export function getStoredPromptPayConfig(): PromptPayConfig {
  const data = localStorage.getItem(STORAGE_KEYS.PROMPTPAY_CONFIG);
  if (!data) return INITIAL_PROMPTPAY;
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_PROMPTPAY;
  }
}

export function savePromptPayConfig(config: PromptPayConfig): void {
  localStorage.setItem(STORAGE_KEYS.PROMPTPAY_CONFIG, JSON.stringify(config));
}

export function getNotificationLogs(): LineNotificationLog[] {
  const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATION_LOGS);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function addNotificationLog(log: Omit<LineNotificationLog, 'id' | 'timestamp'>): void {
  const logs = getNotificationLogs();
  const newLog: LineNotificationLog = {
    ...log,
    id: 'log_' + Date.now(),
    timestamp: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEYS.NOTIFICATION_LOGS, JSON.stringify([newLog, ...logs.slice(0, 49)]));
}
