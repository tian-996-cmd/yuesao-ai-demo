'use client';
import { ClipboardList, Edit3, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ServiceOrder, OrderStatus } from '@/lib/order-types';
import { orderStatusLabels } from '@/lib/order-types';
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
export function OrdersView({
  orders,
  onCreate,
  onEdit,
}: {
  orders: ServiceOrder[];
  onCreate: () => void;
  onEdit: (item: ServiceOrder) => void;
}) {
  const [query, setQuery] = useState(''),
    [status, setStatus] = useState<'全部' | OrderStatus>('全部'),
    [selected, setSelected] = useState<ServiceOrder | null>(null);
  const visible = useMemo(
    () =>
      orders.filter(
        (item) =>
          `${item.customerName ?? ''}${item.workerName ?? ''}${item.serviceType}`.includes(
            query.trim(),
          ) &&
          (status === '全部' || item.status === status),
      ),
    [orders, query, status],
  );
  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <div className="eyebrow">服务履约</div>
          <h1>服务订单</h1>
          <p>管理客户、服务人员、费用与服务周期。</p>
        </div>
        <Button className="primary-button" onClick={onCreate}>
          <Plus />
          新建订单
        </Button>
      </div>
      <section className="pipeline-surface">
        <div className="pipeline-toolbar">
          <div className="search-box">
            <Search />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索客户、人员或服务"
            />
          </div>
          <select
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
          <span>{visible.length} 笔订单</span>
        </div>
        {visible.length ? (
          <>
            <div className="desktop-table crm-table">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>客户</TableHead>
                    <TableHead>服务类型</TableHead>
                    <TableHead>服务人员</TableHead>
                    <TableHead>服务周期</TableHead>
                    <TableHead>服务费用</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <strong>{item.customerName ?? '—'}</strong>
                      </TableCell>
                      <TableCell>{item.serviceType}</TableCell>
                      <TableCell>{item.workerName ?? '待匹配'}</TableCell>
                      <TableCell>
                        {item.startDate}–{item.endDate}
                      </TableCell>
                      <TableCell>¥{item.price.toLocaleString()}</TableCell>
                      <TableCell>
                        <span className="nurse-status nurse-free">
                          {orderStatusLabels[item.status]}
                        </span>
                      </TableCell>
                      <TableCell>
                        <button
                          className="next-action"
                          onClick={() => setSelected(item)}
                        >
                          查看订单
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mobile-customer-list">
              {visible.map((item) => (
                <button
                  className="customer-card"
                  key={item.id}
                  onClick={() => setSelected(item)}
                >
                  <div>
                    <strong>
                      {item.customerName ?? '—'}
                      <small>{item.serviceType}</small>
                    </strong>
                    <span className="nurse-status nurse-free">
                      {orderStatusLabels[item.status]}
                    </span>
                  </div>
                  <p>
                    {item.startDate}–{item.endDate}
                  </p>
                  <footer>
                    <span>{item.workerName ?? '待匹配'}</span>
                    <b>¥{item.price.toLocaleString()}</b>
                  </footer>
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
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <SheetContent className="slot-sheet">
          <SheetHeader>
            <div className="eyebrow">订单详情</div>
            <SheetTitle>{selected?.customerName}</SheetTitle>
            <SheetDescription>服务订单、人员与费用信息</SheetDescription>
          </SheetHeader>
          {selected && (
            <div className="slot-detail">
              <dl>
                <div>
                  <dt>服务类型</dt>
                  <dd>{selected.serviceType}</dd>
                </div>
                <div>
                  <dt>服务人员</dt>
                  <dd>{selected.workerName ?? '待匹配'}</dd>
                </div>
                <div>
                  <dt>开始日期</dt>
                  <dd>{selected.startDate}</dd>
                </div>
                <div>
                  <dt>结束日期</dt>
                  <dd>{selected.endDate}</dd>
                </div>
                <div>
                  <dt>服务费用</dt>
                  <dd>¥{selected.price.toLocaleString()}</dd>
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
              <Button
                className="primary-button"
                onClick={() => {
                  setSelected(null);
                  onEdit(selected);
                }}
              >
                <Edit3 />
                编辑订单
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
