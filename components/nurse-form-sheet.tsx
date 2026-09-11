'use client';
import { useEffect, useState } from 'react';
import { personalityOptions, skillOptions } from '@/lib/nurse-constants';
import type { MaternityNurse, NurseFormInput } from '@/lib/nurse-types';
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

const blank: NurseFormInput = {
  name: '',
  phone: '',
  age: 40,
  hometown: '陕西',
  currentCity: '西安',
  experienceYears: 3,
  serviceCount: 20,
  price26Days: 14000,
  introduction: '',
  availableFrom: '2026-10-15',
  skillTags: ['新生儿护理'],
  personalityTags: ['温和'],
};
export function NurseFormSheet({
  open,
  onOpenChange,
  onSave,
  editing,
}: {
  open: boolean;
  onOpenChange: (x: boolean) => void;
  onSave: (x: NurseFormInput) => Promise<void> | void;
  editing?: MaternityNurse;
}) {
  const [form, setForm] = useState<NurseFormInput>(blank),
    [saving, setSaving] = useState(false),
    [error, setError] = useState('');
  useEffect(() => {
    if (open) {
      setForm(
        editing
          ? {
              name: editing.name,
              phone: editing.phone,
              age: editing.age,
              hometown: editing.hometown,
              currentCity: editing.currentCity,
              experienceYears: editing.experienceYears,
              serviceCount: editing.serviceCount,
              price26Days: editing.price26Days,
              introduction: editing.introduction,
              availableFrom: editing.availableFrom,
              skillTags: editing.skillTags,
              personalityTags: editing.personalityTags,
            }
          : blank,
      );
      setError('');
    }
  }, [open, editing]);
  const set = <K extends keyof NurseFormInput>(
    key: K,
    value: NurseFormInput[K],
  ) => setForm((previous) => ({ ...previous, [key]: value }));
  const toggle = (key: 'skillTags' | 'personalityTags', value: string) =>
    set(
      key,
      form[key].includes(value)
        ? form[key].filter((item) => item !== value)
        : [...form[key], value],
    );
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name || !form.phone) return;
    setSaving(true);
    setError('');
    try {
      await onSave(form);
      onOpenChange(false);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : '保存失败，请稍后重试',
      );
    } finally {
      setSaving(false);
    }
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="new-customer-sheet nurse">
        <form onSubmit={submit}>
          <SheetHeader>
            <div className="eyebrow">月嫂档案</div>
            <SheetTitle>{editing ? '编辑月嫂' : '新增月嫂'}</SheetTitle>
            <SheetDescription>
              记录核心资料，后续可继续补充服务评价与档期。
            </SheetDescription>
          </SheetHeader>
          <div className="form-grid">
            <label>
              姓名
              <Input
                value={form.name}
                onChange={(event) => set('name', event.target.value)}
                required
              />
            </label>
            <label>
              手机
              <Input
                value={form.phone}
                onChange={(event) => set('phone', event.target.value)}
                required
              />
            </label>
            <label>
              年龄
              <Input
                type="number"
                value={form.age}
                onChange={(event) => set('age', Number(event.target.value))}
              />
            </label>
            <label>
              籍贯
              <Input
                value={form.hometown}
                onChange={(event) => set('hometown', event.target.value)}
              />
            </label>
            <label>
              当前城市
              <Input
                value={form.currentCity}
                onChange={(event) => set('currentCity', event.target.value)}
              />
            </label>
            <label>
              最近可上户
              <Input
                type="date"
                value={form.availableFrom}
                onChange={(event) => set('availableFrom', event.target.value)}
              />
            </label>
            <label>
              从业年限
              <Input
                type="number"
                value={form.experienceYears}
                onChange={(event) =>
                  set('experienceYears', Number(event.target.value))
                }
              />
            </label>
            <label>
              服务户数
              <Input
                type="number"
                value={form.serviceCount}
                onChange={(event) =>
                  set('serviceCount', Number(event.target.value))
                }
              />
            </label>
            <label>
              26天价格
              <Input
                type="number"
                value={form.price26Days}
                onChange={(event) =>
                  set('price26Days', Number(event.target.value))
                }
              />
            </label>
            <div />
            <div className="full option-group">
              <span>核心技能</span>
              <div>
                {skillOptions.map((item) => (
                  <button
                    type="button"
                    className={form.skillTags.includes(item) ? 'selected' : ''}
                    key={item}
                    onClick={() => toggle('skillTags', item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <div className="full option-group">
              <span>性格标签</span>
              <div>
                {personalityOptions.map((item) => (
                  <button
                    type="button"
                    className={
                      form.personalityTags.includes(item) ? 'selected' : ''
                    }
                    key={item}
                    onClick={() => toggle('personalityTags', item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <label className="full">
              自我介绍
              <Textarea
                rows={4}
                value={form.introduction}
                onChange={(event) => set('introduction', event.target.value)}
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
            <Button type="submit" className="primary-button" disabled={saving}>
              {saving ? '保存中…' : '保存资料'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
