const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function formatChineseDate(value?: string | null, fallback = '—') {
  if (!value) return fallback;
  const match = ISO_DATE.exec(value.slice(0, 10));
  if (!match) return fallback;
  return `${Number(match[1])}年${Number(match[2])}月${Number(match[3])}日`;
}

export function isoDateToLocalDate(value?: string | null) {
  if (!value) return undefined;
  const match = ISO_DATE.exec(value.slice(0, 10));
  if (!match) return undefined;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function localDateToIso(value?: Date) {
  if (!value) return '';
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatMoney(value: number) {
  return `¥${value.toLocaleString('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}
