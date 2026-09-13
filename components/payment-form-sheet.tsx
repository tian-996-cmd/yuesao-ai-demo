'use client';
import { useState } from 'react';
import type { NewPaymentInput, ServiceOrder } from '@/lib/order-types';
import { formatMoney } from '@/lib/date';
import { DateField } from './date-field';
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

export function PaymentFormSheet({
  onOpenChange,
  order,
  currentDate,
  onSave,
}: {
  onOpenChange: (open: boolean) => void;
  order: ServiceOrder | null;
  currentDate: string;
  onSave: (input: NewPaymentInput) => Promise<void>;
}) {
  const [amount, setAmount] = useState('');
  const [paymentType, setPaymentType] = useState<
    NewPaymentInput['paymentType']
  >(order?.paymentSummary.receivedAmount ? 'final' : 'deposit');
  const [paymentMethod, setPaymentMethod] =
    useState<NewPaymentInput['paymentMethod']>('wechat');
  const [paidAt, setPaidAt] = useState(currentDate);
  const [remark, setRemark] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = Number(amount);
    if (!amount.trim() || !Number.isFinite(value) || value <= 0) {
      setError('请输入大于 0 的有效收款金额');
      return;
    }
    if (!paidAt) {
      setError('请选择收款日期');
      return;
    }
    if (
      order &&
      Math.round(value * 100) >
        Math.round(order.paymentSummary.outstandingAmount * 100)
    ) {
      setError('本次收款金额超过订单待收金额。');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({
        amount: value,
        paymentType,
        paymentMethod,
        paidAt,
        remark: remark.trim(),
      });
      onOpenChange(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '收款记录保存失败');
    } finally {
      setSaving(false);
    }
  };
  return (
    <Sheet open onOpenChange={onOpenChange}>
      <SheetContent className="new-customer-sheet payment-form-sheet">
        <form onSubmit={submit}>
          <SheetHeader>
            <div className="eyebrow">订单收款</div>
            <SheetTitle>新增收款 · {order?.customerName ?? ''}</SheetTitle>
            <SheetDescription>
              当前待收{' '}
              {formatMoney(order?.paymentSummary.outstandingAmount ?? 0)}
              ，确认后将生成独立收款记录。
            </SheetDescription>
          </SheetHeader>
          <div className="form-grid">
            <label htmlFor="payment-amount">
              收款金额
              <Input
                id="payment-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="请输入收款金额"
              />
            </label>
            <label htmlFor="payment-type">
              收款类型
              <select
                id="payment-type"
                value={paymentType}
                onChange={(event) =>
                  setPaymentType(
                    event.target.value as NewPaymentInput['paymentType'],
                  )
                }
              >
                <option value="deposit">定金</option>
                <option value="final">尾款</option>
                <option value="partial">部分收款</option>
                <option value="other">其他收款</option>
              </select>
            </label>
            <label htmlFor="payment-method">
              支付方式
              <select
                id="payment-method"
                value={paymentMethod}
                onChange={(event) =>
                  setPaymentMethod(
                    event.target.value as NewPaymentInput['paymentMethod'],
                  )
                }
              >
                <option value="cash">现金</option>
                <option value="wechat">微信</option>
                <option value="alipay">支付宝</option>
                <option value="bank_transfer">银行转账</option>
                <option value="other">其他</option>
              </select>
            </label>
            <label htmlFor="payment-date">
              收款日期
              <DateField
                id="payment-date"
                value={paidAt}
                onChange={setPaidAt}
                placeholder="请选择收款日期"
                required
              />
            </label>
            <label className="full" htmlFor="payment-remark">
              备注
              <Textarea
                id="payment-remark"
                rows={4}
                maxLength={2000}
                value={remark}
                onChange={(event) => setRemark(event.target.value)}
                placeholder="选填，例如转账凭证或经办说明"
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
              disabled={saving || !amount || !paidAt}
            >
              {saving ? '确认中…' : '确认收款'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
