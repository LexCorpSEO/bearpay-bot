import { Bill, Person, BillParticipant } from '../types';

export function formatTHB(amount: number): string {
  const num = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatThaiDate(dateString: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getDaysRemaining(dueDateString: string): { days: number; isOverdue: boolean; label: string } {
  if (!dueDateString) return { days: 0, isOverdue: false, label: '-' };
  const due = new Date(dueDateString);
  due.setHours(23, 59, 59, 999);
  
  const now = new Date();
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { days: Math.abs(diffDays), isOverdue: true, label: `เกินกำหนด ${Math.abs(diffDays)} วัน` };
  } else if (diffDays === 0) {
    return { days: 0, isOverdue: false, label: 'ครบกำหนดวันนี้!' };
  } else {
    return { days: diffDays, isOverdue: false, label: `เหลืออีก ${diffDays} วัน` };
  }
}

export function generateLineReminderMessage(
  debtorName: string,
  creditorName: string,
  billTitle: string,
  amount: number,
  dueDate: string,
  promptPay?: string,
  promptPayName?: string,
  appUrl: string = 'https://www.bearpay-app.com'
): string {
  const formattedAmount = formatTHB(amount);
  const formattedDate = formatThaiDate(dueDate);
  const daysInfo = getDaysRemaining(dueDate);

  let statusBadge = '⏰ ถึงกำหนดชำระแล้ว';
  if (daysInfo.isOverdue) {
    statusBadge = `🚨 เกินกำหนดชำระแล้ว ${daysInfo.days} วัน`;
  } else if (daysInfo.days === 0) {
    statusBadge = '🔥 ครบกำหนดชำระวันนี้';
  }

  let promptPayText = '';
  if (promptPay) {
    promptPayText = `\n💳 PromptPay: ${promptPay}${promptPayName ? ` (${promptPayName})` : ''}`;
  }

  const finalUrl = appUrl || 'https://www.bearpay-app.com';
  const linkText = `\n\n👇 กดลิงก์เพื่อดูรายละเอียดและแนบสลิป:\n${finalUrl}`;

  return `🐻 [BearPay (หมีเปย์) เตือนชำระ]
สวัสดีครับคุณ ${debtorName} 👋

${statusBadge}
คุณมีรายการค้างชำระกับ "${creditorName}":

📌 รายการ: ${billTitle}
💰 ยอดชำระ: ${formattedAmount}
🗓️ วันกำหนดชำระ: ${formattedDate}${promptPayText}${linkText}

ขอบคุณครับ 🙏✨`;
}

export function generateSummaryLineMessage(
  debtorName: string,
  creditorName: string,
  totalOwed: number,
  unpaidCount: number,
  promptPay?: string,
  promptPayName?: string,
  appUrl: string = 'https://www.bearpay-app.com'
): string {
  const formattedTotal = formatTHB(totalOwed);
  let promptPayText = '';
  if (promptPay) {
    promptPayText = `\n💳 PromptPay: ${promptPay}${promptPayName ? ` (${promptPayName})` : ''}`;
  }

  const finalUrl = appUrl || 'https://www.bearpay-app.com';

  return `🐻 [BearPay (หมีเปย์) สรุปยอดคงเหลือ]
สวัสดีครับคุณ ${debtorName} 👋

สรุปยอดคงค้างชำระทั้งหมดกับ "${creditorName}":
📊 จำนวนรายการค้างชำระ: ${unpaidCount} รายการ
💰 ยอดรวมที่ต้องชำระ: ${formattedTotal}${promptPayText}

🌐 เข้าใช้งานเพื่อตรวจสอบและแนบสลิป: ${finalUrl}
ขอบคุณครับ 🙏✨`;
}
