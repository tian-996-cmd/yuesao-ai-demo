'use client';
import { useState } from 'react';
import type { Customer } from '@/lib/types';
import type { MaternityNurse } from '@/lib/nurse-types';
import type { NewOrderInput, ServiceOrder } from '@/lib/order-types';
import { Button } from './ui/button';
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

const emptyOrder = (customers: Customer[]): NewOrderInput => ({
  customerId: customers[0]?.id ?? '',
  workerId: null,
  serviceType: '月嫂服务',
  status: 'pending',
  startDate: '',
  endDate: '',
  price: 0,
  remark: '',
  createSchedule: true,
});

const orderFormValue = (
  customers: Customer[],
  editing?: ServiceOrder,
): NewOrderInput =>
  editing
    ? {
        customerId: editing.customerId,
        workerId: editing.workerId,
        serviceType: editing.serviceType,
        status: editing.status,
        startDate: editing.startDate,
        endDate: editing.endDate,
        price: editing.price,
        remark: editing.remark,
        createSchedule: false,
      }
    : emptyOrder(customers);

export function OrderFormSheet({
  open,
  onOpenChange,
  customers,
  nurses,
  onSave,
  editing,
}: {
  open: boolean;
  onOpenChange: (x: boolean) => void;
  customers: Customer[];
  nurses: MaternityNurse[];
  onSave: (x: NewOrderInput) => Promise<void>;
  editing?: ServiceOrder;
}) {
  const [form, setForm] = useState<NewOrderInput>(() =>
      orderFormValue(customers, editing),
    ),
    [saving, setSaving] = useState(false),
    [error, setError] = useState('');
  const set = <K extends keyof NewOrderInput>(
    key: K,
    value: NewOrderInput[K],
  ) => setForm((previous) => ({ ...previous, [key]: value }));
  const submit = async (event: { preventDefault(): void }) => {
    event.preventDefault();
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
              <Input
                id="order-start-date"
                type="date"
                value={form.startDate}
                onChange={(event) => set('startDate', event.target.value)}
                required
              />
            </label>
            <label htmlFor="order-end-date">
              结束日期
              <Input
                id="order-end-date"
                type="date"
                value={form.endDate}
                onChange={(event) => set('endDate', event.target.value)}
                required
              />
            </label>
            <label htmlFor="order-price">
              服务费用
              <Input
                id="order-price"
                type="number"
                min="0"
                value={form.price}
                onChange={(event) => set('price', Number(event.target.value))}
              />
            </label>
            <div />
            <label className="full" htmlFor="order-remark">
              备注
              <Textarea
                id="order-remark"
                value={form.remark ?? ''}
                onChange={(event) => set('remark', event.target.value)}
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
