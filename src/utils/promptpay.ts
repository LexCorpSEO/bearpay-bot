/**
 * Utility for PromptPay EMVCo QR Code Payload Generation
 */

function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, '0');
}

function formatTag(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

export function generatePromptPayPayload(target: string, amount?: number): string {
  // Clean target string (remove non-digits)
  const cleaned = target.replace(/\D/g, '');
  let targetType = 'MOBILE';
  let formattedTarget = '';

  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    // Mobile number: 0812345678 -> 0066812345678
    targetType = 'MOBILE';
    formattedTarget = '0066' + cleaned.substring(1);
  } else if (cleaned.length === 13) {
    // National ID: 13 digits
    targetType = 'NAT_ID';
    formattedTarget = cleaned;
  } else {
    // Fallback to mobile if 10 or whatever digits
    targetType = 'MOBILE';
    formattedTarget = '0066' + (cleaned.startsWith('0') ? cleaned.substring(1) : cleaned);
  }

  // Merchant Account Info (Tag 29)
  const aidTag = formatTag('00', 'A000000677010111');
  const targetTag = targetType === 'MOBILE' ? formatTag('01', formattedTarget) : formatTag('02', formattedTarget);
  const merchantInfoTag = formatTag('29', aidTag + targetTag);

  // Payload header
  const payloadFormat = formatTag('00', '01');
  const initiationMethod = formatTag('01', amount ? '12' : '11');
  const currency = formatTag('53', '764'); // THB
  const country = formatTag('58', 'TH');

  let amountTag = '';
  if (amount && amount > 0) {
    amountTag = formatTag('54', amount.toFixed(2));
  }

  const rawData = payloadFormat + initiationMethod + merchantInfoTag + currency + amountTag + country + '6304';
  const checksum = crc16(rawData);

  return rawData + checksum;
}

export function getPromptPayQRImageUrl(target: string, amount?: number): string {
  if (!target) return '';
  const payload = generatePromptPayPayload(target, amount);
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payload)}`;
}
