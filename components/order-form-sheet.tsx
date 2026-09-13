'use client';
import { useState } from 'react';
import type { Customer } from '@/lib/types';
import type { MaternityNurse } from '@/lib/nurse-types';
import type { NewOrderInput, ServiceOrder } from '@/lib/order-types';
import { Button } from './ui/button';
import { DateField } from './date-field';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from './ui/sheet';

const emptyOrder = (
  customers: Customer[],
  presetWorkerId?: string,
): NewOrderInput => ({
  customerId: customers[0]?.id ?? '',
  workerId: presetWorkerId ?? null,
  serviceType: '家政服务',
  status: 'pending',
  startDate: '',
  endDate: '',
  totalAmount: 0,
  depositAmount: 0,
  finalPaymentDueDate: null,
  remark: '',
  createSchedule: true,
});

const orderFormValue = (
  customers: Customer[],
  editing?: ServiceOrder,
  presetWorkerId?: string,
): NewOrderInput =>
  editing
    ? {
        customerId: editing.customerId,
        workerId: editing.workerId,
        serviceType: editing.serviceType,
        status: editing.status,
        startDate: editing.startDate,
        endDate: editing.endDate,
        totalAmount: editing.totalAmount,
        depositAmount: editing.depositAmount,
        finalPaymentDueDate: editing.finalPaymentDueDate ?? null,
        remark: editing.remark,
        createSchedule: false,
      }
    : emptyOrder(customers, presetWorkerId);

export function OrderFormSheet({
  open,
  onOpenChange,
  customers,
  nurses,
  onSave,
  editing,
  presetWorkerId,
}: {
  open: boolean;
  onOpenChange: (x: boolean) => void;
  customers: Customer[];
  nurses: MaternityNurse[];
  onSave: (x: NewOrderInput) => Promise<void>;
  editing?: ServiceOrder;
  presetWorkerId?: string;
}) {
  const [form, setForm] = useState<NewOrderInput>(() =>
      orderFormValue(customers, editing, presetWorkerId),
    ),
    [saving, setSaving] = useState(false),
    [error, setError] = useState('');
  const set = <K extends keyof NewOrderInput>(
    key: K,
    value: NewOrderInput[K],
  ) => setForm((previous) => ({ ...previous, [key]: value }));
  const submit = async (event: { preventDefault(): void }) => {
    event.preventDefault();
    if (!form.customerId || !form.startDate || !form.endDate) {
      setError('请完整填写客户和服务日期');
      return;
    }
    if (!form.serviceType.trim()) {
      setError('服务类型不能为空');
      return;
    }
    if (form.endDate < form.startDate) {
      setError('结束日期不能早于开始日期');
      return;
    }
    if (!Number.isFinite(form.totalAmount) || form.totalAmount <= 0) {
      setError('订单总金额必须大于 0');
      return;
    }
    if (
      !Number.isFinite(form.depositAmount) ||
      form.depositAmount < 0 ||
      form.depositAmount > form.totalAmount
    ) {
      setError('定金金额应在 0 到订单总金额之间');
      return;
    }
    if (
      editing &&
      Math.round(form.totalAmount * 100) <
        Math.round(editing.paymentSummary.receivedAmount * 100)
    ) {
      setError('订单总金额不能低于已收金额，请先处理收款记录。');
      return;
    }
    if ((form.remark?.length ?? 0) > 5000) {
      setError('备注不能超过 5000 字');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave(form);
      onOpenChange(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="new-customer-sheet">
        <form onSubmit={submit}>
          <SheetHeader>
            <div className="eyebrow">建立服务关系</div>
            <SheetTitle>{editing ? '编辑订单' : '新建订单'}</SheetTitle>
            <SheetDescription>
              {editing
                ? '更新订单基础信息，关联排期会同步调整并重新检查冲突。'
                : '保存订单时会同步检查并建立人员排期。'}
            </SheetDescription>
          </SheetHeader>
          <div className="form-grid">
            <label htmlFor="order-customer">
              客户
              <select
                id="order-customer"
                required
                value={form.customerId}
                onChange={(event) => set('customerId', event.target.value)}
              >
                <option value="">请选择客户</option>
                {customers.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor="order-worker">
              服务人员
              <select
                id="order-worker"
                value={form.workerId ?? ''}
                onChange={(event) =>
                  set('workerId', event.target.value || null)
                }
              >
                <option value="">暂不匹配</option>
                {nurses.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor="order-service-type">
              服务类型
              <Input
                id="order-service-type"
                value={form.serviceType}
                onChange={(event) => set('serviceType', event.target.value)}
                maxLength={60}
                required
              />
            </label>
            <label htmlFor="order-status">
              订单状态
              <select
                id="order-status"
                value={form.status}
                onChange={(event) =>
                  set('status', event.target.value as NewOrderInput['status'])
                }
              >
                <option value="pending">待确认</option>
                <option value="confirmed">已确认</option>
                <option value="in_service">服务中</option>
                <option value="completed">已完成</option>
                <option value="cancelled">已取消</option>
              </select>
            </label>
            <label htmlFor="order-start-date">
              开始日期
              <DateField
                id="order-start-date"
                value={form.startDate}
                onChange={(value) => set('startDate', value)}
                placeholder="请选择服务开始日期"
                required
              />
            </label>
            <label htmlFor="order-end-date">
              结束日期
              <DateField
                id="order-end-date"
                value={form.endDate}
                onChange={(value) => set('endDate', value)}
                placeholder="请选择服务结束日期"
                required
              />
            </label>
            <label htmlFor="order-total-amount">
              订单总金额
              <Input
                id="order-total-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={form.totalAmount}
                onChange={(event) =>
                  set('totalAmount', Number(event.target.value))
                }
                required
              />
            </label>
            <label htmlFor="order-deposit-amount">
              定金金额
              <Input
                id="order-deposit-amount"
                type="number"
                min="0"
                step="0.01"
                max={form.totalAmount || undefined}
                value={form.depositAmount}
                onChange={(event) =>
                  set('depositAmount', Number(event.target.value))
                }
              />
            </label>
            <label htmlFor="order-final-due-date">
              尾款应付日期
              <DateField
                id="order-final-due-date"
                value={form.finalPaymentDueDate ?? ''}
                onChange={(value) => set('finalPaymentDueDate', value)}
                placeholder="请选择尾款应付日期"
              />
            </label>
            <div className="order-balance-preview">
              <span>预计尾款</span>
              <strong>
                ¥
                {Math.max(
                  0,
                  form.totalAmount - form.depositAmount,
                ).toLocaleString('zh-CN', {
                  maximumFractionDigits: 2,
                })}
              </strong>
            </div>
            <label className="full" htmlFor="order-remark">
              备注
              <Textarea
                id="order-remark"
                value={form.remark ?? ''}
                onChange={(event) => set('remark', event.target.value)}
                maxLength={5000}
                rows={4}
              />
            </label>
            {error && (
              <p className="form-error full" role="alert">
                {error}
              </p>
            )}
          </div>
          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              取消
            </Button>
            <Button
              type="submit"
              className="primary-button"
              disabled={
                saving || !form.customerId || !form.startDate || !form.endDate
              }
            >
              {saving ? '保存中…' : '保存订单'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
