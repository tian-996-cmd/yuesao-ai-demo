'use client';
import { useEffect, useState } from 'react';
import type { MaternityNurse } from '@/lib/nurse-types';
import { Button } from './ui/button';
import { DateField } from './date-field';
import { Textarea } from './ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from './ui/sheet';
export type ManualScheduleInput = {
  workerId: string;
  startTime: string;
  endTime: string;
  status: 'confirmed' | '休息' | '不可接单';
  remark?: string;
};
export function ScheduleFormSheet({
  open,
  onOpenChange,
  worker,
  currentDate,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  worker?: MaternityNurse;
  currentDate: string;
  onSave: (input: ManualScheduleInput) => Promise<void>;
}) {
  const [start, setStart] = useState(currentDate),
    [end, setEnd] = useState(currentDate),
    [status, setStatus] = useState<ManualScheduleInput['status']>('confirmed'),
    [remark, setRemark] = useState(''),
    [saving, setSaving] = useState(false),
    [error, setError] = useState('');
  useEffect(() => {
    if (open) {
      setStart(currentDate);
      setEnd(currentDate);
      setStatus('confirmed');
      setRemark('');
      setError('');
    }
  }, [open, currentDate]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!worker) {
      setError('未选择服务人员');
      return;
    }
    if (!start || !end) {
      setError('请选择开始和结束日期');
      return;
    }
    if (end < start) {
      setError('结束日期不能早于开始日期');
      return;
    }
    if (remark.length > 5000) {
      setError('原因不能超过 5000 字');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({
        workerId: worker.id,
        startTime: start,
        endTime: end,
        status,
        remark: remark.trim(),
      });
      onOpenChange(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '新增档期失败');
    } finally {
      setSaving(false);
    }
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="new-customer-sheet">
        <form onSubmit={submit}>
          <SheetHeader>
            <div className="eyebrow">手工锁档</div>
            <SheetTitle>新增档期 · {worker?.name ?? '未选择'}</SheetTitle>
            <SheetDescription>
              开始日和结束日均计入占用；与订单或其他手工档期冲突时无法保存。
            </SheetDescription>
          </SheetHeader>
          <div className="form-grid">
            <label>
              开始日期
              <DateField
                value={start}
                onChange={setStart}
                placeholder="请选择开始日期"
                required
              />
            </label>
            <label>
              结束日期
              <DateField
                value={end}
                onChange={setEnd}
                placeholder="请选择结束日期"
                required
              />
            </label>
            <label>
              类型
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as ManualScheduleInput['status'])
                }
              >
                <option value="confirmed">手工锁档</option>
                <option value="休息">休息</option>
                <option value="不可接单">不可接单</option>
              </select>
            </label>
            <div />
            <label className="full">
              原因（选填）
              <Textarea
                rows={4}
                maxLength={5000}
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
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
              disabled={saving || !worker}
            >
              {saving ? '保存中…' : '保存档期'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
