'use client';
import {
  Banknote,
  ClipboardList,
  Edit3,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type {
  NewPaymentInput,
  OrderStatus,
  PaymentRecord,
  PaymentStatus,
  PaymentSummary,
  ServiceOrder,
} from '@/lib/order-types';
import {
  orderStatusLabels,
  paymentMethodLabels,
  paymentStatusLabels,
  paymentTypeLabels,
} from '@/lib/order-types';
import { formatChineseDate, formatMoney } from '@/lib/date';
import { PaymentFormSheet } from './payment-form-sheet';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from './ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

type PaymentDetail = { items: PaymentRecord[]; paymentSummary: PaymentSummary };

export function OrdersView({
  orders,
  currentDate,
  canManagePayments,
  initialPaymentFilter,
  onCreate,
  onEdit,
  onLoadPayments,
  onAddPayment,
  onVoidPayment,
}: {
  orders: ServiceOrder[];
  currentDate: string;
  canManagePayments: boolean;
  initialPaymentFilter?: PaymentStatus | '全部';
  onCreate: () => void;
  onEdit: (item: ServiceOrder) => void;
  onLoadPayments: (item: ServiceOrder) => Promise<PaymentDetail>;
  onAddPayment: (
    item: ServiceOrder,
    input: NewPaymentInput,
  ) => Promise<PaymentDetail>;
  onVoidPayment: (
    item: ServiceOrder,
    paymentId: string,
  ) => Promise<PaymentDetail>;
}) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<'全部' | OrderStatus>('全部');
  const [paymentStatus, setPaymentStatus] = useState<'全部' | PaymentStatus>(
    initialPaymentFilter ?? '全部',
  );
  const [selected, setSelected] = useState<ServiceOrder | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [voidingId, setVoidingId] = useState('');
  const [detailError, setDetailError] = useState('');
  const visible = useMemo(
    () =>
      orders.filter(
        (item) =>
          `${item.customerName ?? ''}${item.workerName ?? ''}${item.serviceType}`.includes(
            query.trim(),
          ) &&
          (status === '全部' || item.status === status) &&
          (paymentStatus === '全部' ||
            item.paymentSummary.paymentStatus === paymentStatus),
      ),
    [orders, query, status, paymentStatus],
  );
  const applyDetail = (item: ServiceOrder, detail: PaymentDetail) => {
    setSelected({
      ...item,
      paymentSummary: detail.paymentSummary,
      payments: detail.items,
    });
    setPayments(detail.items);
  };
  const openDetail = async (item: ServiceOrder) => {
    setSelected(item);
    setPayments(item.payments ?? []);
    setLoadingPayments(true);
    setDetailError('');
    try {
      applyDetail(item, await onLoadPayments(item));
    } catch (reason) {
      setDetailError(
        reason instanceof Error ? reason.message : '收款记录加载失败',
      );
    } finally {
      setLoadingPayments(false);
    }
  };
  const summary = selected?.paymentSummary;
  return (
    <div className="page-stack orders-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">服务履约 · 收款</div>
          <h1>服务订单</h1>
          <p>统一查看订单履约、应收与逐笔收款记录。</p>
        </div>
        <Button className="primary-button" onClick={onCreate}>
          <Plus />
          新建订单
        </Button>
      </div>
      <section className="pipeline-surface">
        <div className="pipeline-toolbar order-toolbar">
          <div className="search-box">
            <Search />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索客户、人员或服务"
            />
          </div>
          <select
            aria-label="订单状态"
            value={status}
            onChange={(event) => setStatus(event.target.value as typeof status)}
          >
            <option>全部</option>
            {Object.entries(orderStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            aria-label="付款状态"
            value={paymentStatus}
            onChange={(event) =>
              setPaymentStatus(event.target.value as typeof paymentStatus)
            }
          >
            <option value="全部">全部付款状态</option>
            {Object.entries(paymentStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <span>{visible.length} 笔订单</span>
        </div>
        {visible.length ? (
          <>
            <div className="desktop-table crm-table order-table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>客户 / 服务人员</TableHead>
                    <TableHead>服务周期</TableHead>
                    <TableHead>总金额</TableHead>
                    <TableHead>已收</TableHead>
                    <TableHead>待收</TableHead>
                    <TableHead>付款状态</TableHead>
                    <TableHead>订单状态</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <strong>{item.customerName ?? '—'}</strong>
                        <small className="order-worker">
                          {item.workerName ?? '待匹配'} · {item.serviceType}
                        </small>
                      </TableCell>
                      <TableCell>
                        {formatChineseDate(item.startDate)}
                        <small className="date-range-end">
                          至 {formatChineseDate(item.endDate)}
                        </small>
                      </TableCell>
                      <TableCell>
                        {formatMoney(item.paymentSummary.totalAmount)}
                      </TableCell>
                      <TableCell>
                        {formatMoney(item.paymentSummary.receivedAmount)}
                      </TableCell>
                      <TableCell
                        className={
                          item.paymentSummary.paymentStatus === 'overdue'
                            ? 'amount-overdue'
                            : ''
                        }
                      >
                        {formatMoney(item.paymentSummary.outstandingAmount)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`payment-status payment-${item.paymentSummary.paymentStatus}`}
                        >
                          {item.paymentSummary.paymentStatus === 'overdue'
                            ? `尾款逾期 ${item.paymentSummary.overdueDays} 天`
                            : paymentStatusLabels[
                                item.paymentSummary.paymentStatus
                              ]}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="nurse-status nurse-free">
                          {orderStatusLabels[item.status]}
                        </span>
                      </TableCell>
                      <TableCell>
                        <button
                          className="next-action"
                          onClick={() => void openDetail(item)}
                        >
                          查看订单
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mobile-customer-list order-mobile-list">
              {visible.map((item) => (
                <button
                  className="customer-card"
                  key={item.id}
                  onClick={() => void openDetail(item)}
                >
                  <div>
                    <strong>
                      {item.customerName ?? '—'}
                      <small>
                        {item.workerName ?? '待匹配'} · {item.serviceType}
                      </small>
                    </strong>
                    <span
                      className={`payment-status payment-${item.paymentSummary.paymentStatus}`}
                    >
                      {paymentStatusLabels[item.paymentSummary.paymentStatus]}
                    </span>
                  </div>
                  <p>
                    {formatChineseDate(item.startDate)} 至{' '}
                    {formatChineseDate(item.endDate)}
                  </p>
                  <div className="mobile-payment-amounts">
                    <span>
                      总额 <b>{formatMoney(item.paymentSummary.totalAmount)}</b>
                    </span>
                    <span>
                      已收{' '}
                      <b>{formatMoney(item.paymentSummary.receivedAmount)}</b>
                    </span>
                    <span>
                      待收{' '}
                      <b>
                        {formatMoney(item.paymentSummary.outstandingAmount)}
                      </b>
                    </span>
                  </div>
                  {item.paymentSummary.paymentStatus === 'overdue' && (
                    <em>尾款逾期 {item.paymentSummary.overdueDays} 天</em>
                  )}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <ClipboardList />
            <h3>暂无符合条件的订单</h3>
          </div>
        )}
      </section>
      <Sheet
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
            setPaymentOpen(false);
          }
        }}
      >
        <SheetContent className="slot-sheet order-detail-sheet">
          <SheetHeader>
            <div className="eyebrow">订单详情</div>
            <SheetTitle>{selected?.customerName}</SheetTitle>
            <SheetDescription>
              服务履约与收款使用不同状态，互不覆盖。
            </SheetDescription>
          </SheetHeader>
          {selected && summary && (
            <div className="order-detail-content">
              <section className="order-detail-section">
                <header>
                  <h3>订单信息</h3>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelected(null);
                      onEdit(selected);
                    }}
                  >
                    <Edit3 />
                    编辑订单
                  </Button>
                </header>
                <dl className="order-info-grid">
                  <div>
                    <dt>服务类型</dt>
                    <dd>{selected.serviceType}</dd>
                  </div>
                  <div>
                    <dt>服务人员</dt>
                    <dd>{selected.workerName ?? '待匹配'}</dd>
                  </div>
                  <div>
                    <dt>服务开始</dt>
                    <dd>{formatChineseDate(selected.startDate)}</dd>
                  </div>
                  <div>
                    <dt>服务结束</dt>
                    <dd>{formatChineseDate(selected.endDate)}</dd>
                  </div>
                  <div>
                    <dt>订单状态</dt>
                    <dd>{orderStatusLabels[selected.status]}</dd>
                  </div>
                  <div>
                    <dt>备注</dt>
                    <dd>{selected.remark || '无'}</dd>
                  </div>
                </dl>
              </section>
              <section className="order-detail-section payment-summary-section">
                <header>
                  <div>
                    <h3>收款情况</h3>
                    <p>付款状态由有效收款记录自动计算</p>
                  </div>
                  {canManagePayments &&
                    selected.status !== 'cancelled' &&
                    summary.outstandingAmount > 0 && (
                      <Button
                        className="primary-button"
                        onClick={() => setPaymentOpen(true)}
                      >
                        <Banknote />
                        新增收款
                      </Button>
                    )}
                </header>
                <div className="payment-summary-grid">
                  <div>
                    <span>订单总金额</span>
                    <strong>{formatMoney(summary.totalAmount)}</strong>
                  </div>
                  <div>
                    <span>定金金额</span>
                    <strong>{formatMoney(summary.depositAmount)}</strong>
                  </div>
                  <div>
                    <span>已收金额</span>
                    <strong>{formatMoney(summary.receivedAmount)}</strong>
                  </div>
                  <div>
                    <span>待收金额</span>
                    <strong
                      className={
                        summary.paymentStatus === 'overdue'
                          ? 'amount-overdue'
                          : ''
                      }
                    >
                      {formatMoney(summary.outstandingAmount)}
                    </strong>
                  </div>
                  <div>
                    <span>尾款应付日期</span>
                    <strong>
                      {formatChineseDate(summary.finalPaymentDueDate, '未设置')}
                    </strong>
                  </div>
                  <div>
                    <span>付款状态</span>
                    <strong>
                      <span
                        className={`payment-status payment-${summary.paymentStatus}`}
                      >
                        {paymentStatusLabels[summary.paymentStatus]}
                      </span>
                    </strong>
                  </div>
                </div>
                {summary.paymentStatus === 'overdue' && (
                  <div className="payment-overdue-note">
                    尾款逾期 {summary.overdueDays} 天 · 待收{' '}
                    {formatMoney(summary.outstandingAmount)}
                  </div>
                )}
              </section>
              <section className="order-detail-section payment-records">
                <header>
                  <div>
                    <h3>收款记录</h3>
                    <p>
                      {payments.filter((item) => !item.voided).length}{' '}
                      笔有效记录
                    </p>
                  </div>
                </header>
                {loadingPayments ? (
                  <p className="empty-inline">正在加载收款记录…</p>
                ) : detailError ? (
                  <p className="form-error">{detailError}</p>
                ) : payments.length ? (
                  <div className="payment-record-list">
                    {payments.map((item) => (
                      <article
                        key={item.id}
                        className={item.voided ? 'is-voided' : ''}
                      >
                        <div>
                          <strong>{formatMoney(item.amount)}</strong>
                          <span>
                            {paymentTypeLabels[item.paymentType]} ·{' '}
                            {paymentMethodLabels[item.paymentMethod]}
                          </span>
                        </div>
                        <div>
                          <time>{formatChineseDate(item.paidAt)}</time>
                          <small>经办人：{item.creatorName ?? '王敏'}</small>
                        </div>
                        <p>{item.remark || '无备注'}</p>
                        {item.voided ? (
                          <em>已作废，不计入已收</em>
                        ) : (
                          canManagePayments && (
                            <button
                              disabled={voidingId === item.id}
                              onClick={async () => {
                                if (
                                  !window.confirm(
                                    '确认作废这笔收款？记录会保留，但不再计入已收金额。',
                                  )
                                )
                                  return;
                                setVoidingId(item.id);
                                setDetailError('');
                                try {
                                  applyDetail(
                                    selected,
                                    await onVoidPayment(selected, item.id),
                                  );
                                } catch (reason) {
                                  setDetailError(
                                    reason instanceof Error
                                      ? reason.message
                                      : '作废失败',
                                  );
                                } finally {
                                  setVoidingId('');
                                }
                              }}
                            >
                              <Trash2 />
                              {voidingId === item.id ? '作废中…' : '作废'}
                            </button>
                          )
                        )}
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="payment-empty">
                    <Banknote />
                    <p>尚无收款记录</p>
                    <span>记录后，已收与待收金额会自动更新。</span>
                  </div>
                )}
              </section>
            </div>
          )}
        </SheetContent>
      </Sheet>
      {paymentOpen && (
        <PaymentFormSheet
          onOpenChange={setPaymentOpen}
          order={selected}
          currentDate={currentDate}
          onSave={async (input) => {
            if (!selected) return;
            applyDetail(selected, await onAddPayment(selected, input));
          }}
        />
      )}
    </div>
  );
}
