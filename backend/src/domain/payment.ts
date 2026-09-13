export type PaymentStatus =
  | 'unpaid'
  | 'partial_paid'
  | 'pending_final'
  | 'overdue'
  | 'paid';

export type PaymentSummary = {
  totalAmount: number;
  depositAmount: number;
  receivedAmount: number;
  outstandingAmount: number;
  finalPaymentDueDate: string | null;
  paymentStatus: PaymentStatus;
  overdueDays: number;
};

export function moneyToCents(value: string | number): bigint {
  const text = typeof value === 'number' ? value.toFixed(2) : value.trim();
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(text);
  if (!match) throw new TypeError(`Invalid money value: ${value}`);
  const cents =
    BigInt(match[2]) * BigInt(100) + BigInt((match[3] ?? '').padEnd(2, '0'));
  return match[1] ? -cents : cents;
}

export function centsToNumber(value: bigint) {
  return Number(value) / 100;
}

function calendarDaysBetween(from: string, to: string) {
  return Math.floor(
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
      86_400_000,
  );
}

export function calculatePaymentSummary(input: {
  totalAmount: string | number;
  depositAmount: string | number;
  receivedAmount: string | number;
  finalPaymentDueDate?: string | null;
  today: string;
}): PaymentSummary {
  const total = moneyToCents(input.totalAmount);
  const deposit = moneyToCents(input.depositAmount);
  const received = moneyToCents(input.receivedAmount);
  const outstanding = total > received ? total - received : BigInt(0);
  const isOverdue = Boolean(
    outstanding > BigInt(0) &&
    input.finalPaymentDueDate &&
    input.today > input.finalPaymentDueDate,
  );
  let paymentStatus: PaymentStatus;
  if (received >= total && total > BigInt(0)) paymentStatus = 'paid';
  else if (isOverdue) paymentStatus = 'overdue';
  else if (received <= BigInt(0)) paymentStatus = 'unpaid';
  else if (deposit > BigInt(0) && received >= deposit)
    paymentStatus = 'pending_final';
  else paymentStatus = 'partial_paid';

  return {
    totalAmount: centsToNumber(total),
    depositAmount: centsToNumber(deposit),
    receivedAmount: centsToNumber(received),
    outstandingAmount: centsToNumber(outstanding),
    finalPaymentDueDate: input.finalPaymentDueDate ?? null,
    paymentStatus,
    overdueDays:
      isOverdue && input.finalPaymentDueDate
        ? calendarDaysBetween(input.finalPaymentDueDate, input.today)
        : 0,
  };
}
