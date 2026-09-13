import type {
  PaymentRecord,
  PaymentStatus,
  PaymentSummary,
  ServiceOrder,
} from './order-types';
const DAY = 86_400_000;
const cents = (value: number) => Math.round(value * 100);
export function summarizeDemoPayment(
  order: Pick<
    ServiceOrder,
    'totalAmount' | 'depositAmount' | 'finalPaymentDueDate' | 'payments'
  >,
  today: string,
): PaymentSummary {
  const total = cents(order.totalAmount);
  const deposit = cents(order.depositAmount);
  const received = (order.payments ?? [])
    .filter((payment) => !payment.voided && !payment.deletedAt)
    .reduce((sum, payment) => sum + cents(payment.amount), 0);
  const outstanding = Math.max(0, total - received);
  const overdue = Boolean(
    outstanding > 0 &&
    order.finalPaymentDueDate &&
    today > order.finalPaymentDueDate,
  );
  let paymentStatus: PaymentStatus;
  if (received >= total && total > 0) paymentStatus = 'paid';
  else if (overdue) paymentStatus = 'overdue';
  else if (received <= 0) paymentStatus = 'unpaid';
  else if (deposit > 0 && received >= deposit) paymentStatus = 'pending_final';
  else paymentStatus = 'partial_paid';
  const overdueDays =
    overdue && order.finalPaymentDueDate
      ? Math.floor(
          (Date.parse(`${today}T00:00:00Z`) -
            Date.parse(`${order.finalPaymentDueDate}T00:00:00Z`)) /
            DAY,
        )
      : 0;
  return {
    totalAmount: total / 100,
    depositAmount: deposit / 100,
    receivedAmount: received / 100,
    outstandingAmount: outstanding / 100,
    finalPaymentDueDate: order.finalPaymentDueDate ?? null,
    paymentStatus,
    overdueDays,
  };
}
export function withDemoPaymentSummary(order: ServiceOrder, today: string) {
  return { ...order, paymentSummary: summarizeDemoPayment(order, today) };
}
export function aggregatePaymentMetrics(
  orders: ServiceOrder[],
  currentDate: string,
) {
  const month = currentDate.slice(0, 7);
  const activeOrders = orders.filter((order) => order.status !== 'cancelled');
  return {
    pendingAmount: activeOrders.reduce(
      (sum, order) => sum + order.paymentSummary.outstandingAmount,
      0,
    ),
    overdueCount: activeOrders.filter(
      (order) => order.paymentSummary.paymentStatus === 'overdue',
    ).length,
    overdueAmount: activeOrders
      .filter((order) => order.paymentSummary.paymentStatus === 'overdue')
      .reduce((sum, order) => sum + order.paymentSummary.outstandingAmount, 0),
    receivedThisMonth: orders
      .flatMap((order) => order.payments ?? [])
      .filter(
        (payment) =>
          !payment.voided &&
          !payment.deletedAt &&
          payment.paidAt.startsWith(month),
      )
      .reduce((sum, payment) => sum + payment.amount, 0),
  };
}
export function newDemoPayment(
  orderId: string,
  input: Omit<PaymentRecord, 'id' | 'orderId'>,
) {
  return { ...input, id: crypto.randomUUID(), orderId };
}
