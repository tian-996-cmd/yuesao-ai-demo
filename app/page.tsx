'use client';

import { useCallback, useEffect, useState } from 'react';
import { AppShell, type ViewName } from '@/components/app-shell';
import { CustomerDetailView } from '@/components/customer-detail-view';
import { CustomersView } from '@/components/customers-view';
import { DashboardView } from '@/components/dashboard-view';
import { DemandParserSheet } from '@/components/demand-parser-sheet';
import { FollowupSheet } from '@/components/followup-sheet';
import { LoginView } from '@/components/login-view';
import { MatchingView } from '@/components/matching-view';
import { NewCustomerSheet } from '@/components/new-customer-sheet';
import { NurseDetailView } from '@/components/nurse-detail-view';
import { NurseFormSheet } from '@/components/nurse-form-sheet';
import { NursesView } from '@/components/nurses-view';
import { OrderFormSheet } from '@/components/order-form-sheet';
import { OrdersView } from '@/components/orders-view';
import { ScheduleView } from '@/components/schedule-view';
import { SettingsView } from '@/components/settings-view';
import { mockCustomers } from '@/lib/mock-data';
import { mockNurses } from '@/lib/mock-nurses';
import { mockMediaAssets } from '@/lib/mock-media';
import { mockOrders } from '@/lib/mock-orders';
import type { MediaAsset, MediaUploadMetadata } from '@/lib/media-types';
import type {
  MaternityNurse,
  NurseFormInput,
  NurseStatus,
} from '@/lib/nurse-types';
import type { NewOrderInput, ServiceOrder } from '@/lib/order-types';
import type { Customer, DemandProfile, NewCustomerInput } from '@/lib/types';
import { addDays } from '@/lib/v3-engine';
import {
  currentDemoPath,
  isGitHubPagesBuild,
  parseDemoRoute,
  pushDemoPath,
} from '@/lib/demo-routing';
import { isProductionMode } from '@/lib/runtime-mode';
import { customerService } from '@/services/customer-service';
import { nurseService } from '@/services/nurse-service';
import { mediaService } from '@/services/media-service';
import { orderService } from '@/services/order-service';
import { productionApi } from '@/services/production-api';
import { tokenStore } from '@/services/api-client';

export function DemoApp({
  initialView = 'dashboard',
}: {
  initialView?: ViewName;
}) {
  const [loggedIn, setLoggedIn] = useState(
    () =>
      !isProductionMode &&
      typeof window !== 'undefined' &&
      isGitHubPagesBuild &&
      sessionStorage.getItem('yuesao-demo-pages-login') === '1',
  );
  const [authChecking, setAuthChecking] = useState(isProductionMode);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [view, setView] = useState<ViewName>(initialView);
  const [customers, setCustomers] = useState<Customer[]>(
    isProductionMode ? [] : mockCustomers,
  );
  const [nurses, setNurses] = useState<MaternityNurse[]>(
    isProductionMode ? [] : mockNurses,
  );
  const [orders, setOrders] = useState<ServiceOrder[]>(
    isProductionMode ? [] : mockOrders,
  );
  const [media, setMedia] = useState<MediaAsset[]>(mockMediaAssets);
  const [selectedId, setSelectedId] = useState('wang'),
    [selectedNurseId, setSelectedNurseId] = useState('nurse_001');
  const [nurseFilter] = useState<NurseStatus>();
  const [focusNurseId, setFocusNurseId] = useState<string>();
  const [customerSheetOpen, setCustomerSheetOpen] = useState(false),
    [nurseSheetOpen, setNurseSheetOpen] = useState(false),
    [orderSheetOpen, setOrderSheetOpen] = useState(false);
  const [editingNurse, setEditingNurse] = useState<MaternityNurse>();
  const [editingCustomer, setEditingCustomer] = useState<Customer>();
  const [editingOrder, setEditingOrder] = useState<ServiceOrder>();
  const [message, setMessage] = useState(''),
    [demandOpen, setDemandOpen] = useState(false),
    [followupOpen, setFollowupOpen] = useState(false),
    [matchingCustomerId, setMatchingCustomerId] = useState('wang');

  const showMessage = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(''), 2600);
  };
  const loadProduction = useCallback(async () => {
    setLoading(true);
    setApiError('');
    try {
      const data = await productionApi.bootstrap();
      setCustomers(data.customers);
      setNurses(data.nurses);
      setOrders(data.orders);
      setSelectedId((x) =>
        data.customers.some((c) => c.id === x)
          ? x
          : (data.customers[0]?.id ?? ''),
      );
      setSelectedNurseId((x) =>
        data.nurses.some((n) => n.id === x) ? x : (data.nurses[0]?.id ?? ''),
      );
      setMatchingCustomerId((x) =>
        data.customers.some((c) => c.id === x)
          ? x
          : (data.customers[0]?.id ?? ''),
      );
    } catch (error) {
      setApiError(error instanceof Error ? error.message : '业务数据加载失败');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const syncRoute = () => {
      const route = parseDemoRoute(currentDemoPath());
      setView(route.view);
      if (route.nurseId) setSelectedNurseId(route.nurseId);
      if (route.customerId) setSelectedId(route.customerId);
      setFocusNurseId(route.focusNurseId);
    };
    syncRoute();
    window.addEventListener('popstate', syncRoute);
    window.addEventListener('hashchange', syncRoute);
    void mediaService.listAll().then(setMedia);
    if (isProductionMode) {
      if (!tokenStore.get()) {
        setAuthChecking(false);
      } else {
        productionApi
          .me()
          .then(() => {
            setLoggedIn(true);
            return loadProduction();
          })
          .catch(() => setLoggedIn(false))
          .finally(() => setAuthChecking(false));
      }
    } else {
      setCustomers(customerService.load());
      setNurses(nurseService.load());
      setOrders(orderService.load());
    }
    return () => {
      window.removeEventListener('popstate', syncRoute);
      window.removeEventListener('hashchange', syncRoute);
    };
  }, [loadProduction]);

  const persistCustomers = (next: Customer[]) => {
    setCustomers(next);
    if (!isProductionMode) customerService.save(next);
  };
  const persistNurses = (next: MaternityNurse[]) => {
    setNurses(next);
    if (!isProductionMode) nurseService.save(next);
  };
  const persistOrders = (next: ServiceOrder[]) => {
    setOrders(next);
    if (!isProductionMode) orderService.save(next);
  };
  const pathFor = (next: ViewName) =>
    next === 'dashboard'
      ? '/'
      : next === 'customers'
        ? '/customers'
        : next === 'nurses'
          ? '/nurses'
          : next === 'orders'
            ? '/orders'
            : next === 'schedule'
              ? '/schedule'
              : next === 'matching'
                ? '/matching'
                : next === 'settings'
                  ? '/settings'
                  : window.location.pathname;
  const navigate = (next: ViewName) => {
    setView(next);
    pushDemoPath(pathFor(next));
    window.scrollTo(0, 0);
  };
  const openCustomer = (id: string) => {
    setSelectedId(id);
    setView('detail');
    pushDemoPath(`/customers/${id}`);
    window.scrollTo(0, 0);
  };
  const openNurse = (id: string) => {
    setSelectedNurseId(id);
    setView('nurseDetail');
    pushDemoPath(`/nurses/${id}`);
    window.scrollTo(0, 0);
  };
  const openSchedule = (id?: string) => {
    setFocusNurseId(id);
    setView('schedule');
    pushDemoPath(id ? `/schedule?nurse=${id}` : '/schedule');
    window.scrollTo(0, 0);
  };
  const openMatching = (id?: string) => {
    if (id) setMatchingCustomerId(id);
    setView('matching');
    pushDemoPath('/matching');
    window.scrollTo(0, 0);
  };
  const notify = (name: string) => showMessage(`${name}已记录在演示流程中`);

  const saveCustomer = async (input: NewCustomerInput) => {
    if (editingCustomer) {
      const next = { ...editingCustomer, ...input };
      if (isProductionMode) {
        const item = await productionApi.updateCustomer(next);
        setCustomers((list) =>
          list.map((customer) => (customer.id === item.id ? item : customer)),
        );
      } else
        persistCustomers(
          customers.map((customer) =>
            customer.id === editingCustomer.id ? next : customer,
          ),
        );
      setEditingCustomer(undefined);
      showMessage('客户资料已更新');
      return;
    }
    if (isProductionMode) {
      const item = await productionApi.createCustomer(input);
      setCustomers((list) => [item, ...list]);
      showMessage('客户已保存到服务器');
    } else {
      const item: Customer = {
        ...input,
        id: crypto.randomUUID(),
        phone: input.phone.replace(/(\d{3})\d+(\d{4})/, '$1****$2'),
        family: '待补充家庭情况。',
        requirements: [],
        exclusions: [],
        status: '新客户',
        recommendedCount: 0,
        consultant: '王敏',
        lastFollowUp: '刚刚',
        followUps: [{ time: '刚刚', content: '新建客户档案。' }],
      };
      persistCustomers([item, ...customers]);
      showMessage('客户已保存到本地列表');
    }
  };
  const saveNurse = async (input: NurseFormInput) => {
    if (isProductionMode) {
      if (editingNurse) {
        const item = await productionApi.updateWorker({
          ...editingNurse,
          ...input,
        });
        setNurses((list) => list.map((n) => (n.id === item.id ? item : n)));
        showMessage('人员资料已更新');
      } else {
        const item = await productionApi.createWorker(input);
        setNurses((list) => [item, ...list]);
        showMessage('人员已保存到服务器');
      }
    } else if (editingNurse) {
      persistNurses(
        nurses.map((n) => (n.id === editingNurse.id ? { ...n, ...input } : n)),
      );
      showMessage('月嫂资料已更新');
    } else {
      const item: MaternityNurse = {
        ...input,
        id: crypto.randomUUID(),
        status: '空档',
        specialExperienceTags: [],
        ratings: {
          overall: 4.8,
          newbornCare: 8.5,
          postpartumCare: 8.5,
          cooking: 8.2,
          communication: 8.6,
          boundarySense: 8.5,
          nightCare: 8.4,
        },
        serviceHistory: [],
        reviews: [],
        schedule: [],
      };
      persistNurses([item, ...nurses]);
      showMessage('月嫂已保存到本地人才库');
    }
    setEditingNurse(undefined);
  };
  const disableCustomer = async (customer: Customer) => {
    try {
      if (isProductionMode) await productionApi.deleteCustomer(customer.id);
      else
        customerService.save(
          customers.filter((item) => item.id !== customer.id),
        );
      setCustomers((list) => list.filter((item) => item.id !== customer.id));
      navigate('customers');
      showMessage('客户已停用');
    } catch (reason) {
      showMessage(reason instanceof Error ? reason.message : '停用失败');
    }
  };
  const disableWorker = async (worker: MaternityNurse) => {
    try {
      if (isProductionMode) await productionApi.deleteWorker(worker.id);
      else nurseService.save(nurses.filter((item) => item.id !== worker.id));
      setNurses((list) => list.filter((item) => item.id !== worker.id));
      navigate('nurses');
      showMessage('人员已停用');
    } catch (reason) {
      showMessage(reason instanceof Error ? reason.message : '停用失败');
    }
  };
  const saveOrder = async (input: NewOrderInput) => {
    if (editingOrder) {
      if (isProductionMode) {
        await productionApi.updateOrder(editingOrder.id, input);
        await loadProduction();
      } else
        persistOrders(
          orders.map((item) =>
            item.id === editingOrder.id ? { ...editingOrder, ...input } : item,
          ),
        );
      setEditingOrder(undefined);
      showMessage('订单已更新');
      return;
    }
    if (isProductionMode) {
      await productionApi.createOrder(input);
      await loadProduction();
      showMessage('订单与排期已保存到服务器');
    } else {
      const customer = customers.find((c) => c.id === input.customerId),
        worker = nurses.find((n) => n.id === input.workerId);
      if (worker && input.createSchedule) {
        const collision = worker.schedule.some(
          (x) =>
            x.status !== '空档' &&
            x.status !== '休息' &&
            x.start <= input.endDate &&
            x.end >= input.startDate,
        );
        if (collision) throw new Error('该人员当前时间段已有服务安排。');
      }
      const item: ServiceOrder = {
        ...input,
        id: crypto.randomUUID(),
        customerName: customer?.name,
        workerName: worker?.name,
      };
      persistOrders([item, ...orders]);
      if (worker && input.createSchedule)
        persistNurses(
          nurses.map((n) =>
            n.id === worker.id
              ? {
                  ...n,
                  schedule: [
                    ...n.schedule,
                    {
                      id: crypto.randomUUID(),
                      nurseId: n.id,
                      customerId: customer?.id,
                      customerName: customer?.name,
                      start: input.startDate,
                      end: input.endDate,
                      status: '已锁档',
                      note: input.remark ?? '',
                    },
                  ],
                }
              : n,
          ),
        );
      showMessage('演示订单已保存');
    }
  };
  const updateCustomer = async (
    id: string,
    change: (c: Customer) => Customer,
  ) => {
    const current = customers.find((c) => c.id === id);
    if (!current) return;
    const next = change(current);
    if (isProductionMode) {
      const saved = await productionApi.updateCustomer(next);
      setCustomers((list) => list.map((c) => (c.id === id ? saved : c)));
    } else persistCustomers(customers.map((c) => (c.id === id ? next : c)));
  };
  const selected = customers.find((c) => c.id === selectedId) ?? customers[0];
  const selectedNurse =
    nurses.find((n) => n.id === selectedNurseId) ?? nurses[0];
  const applyDemand = (profile: DemandProfile) => {
    if (!selected) return;
    void updateCustomer(selected.id, (c) => ({
      ...c,
      demandProfile: profile,
      requirements: profile.mustHaves,
      exclusions: profile.exclusions,
      lastFollowUp: '刚刚',
      followUps: [
        { time: '刚刚', content: 'AI 已整理客户需求并写入档案。' },
        ...c.followUps,
      ],
    }))
      .then(() => showMessage('结构化需求已写入客户档案'))
      .catch((e) => showMessage(e.message));
  };
  const addFollowup = (content: string) => {
    if (!selected) return;
    void updateCustomer(selected.id, (c) => ({
      ...c,
      lastFollowUp: '刚刚',
      followUps: [{ time: '刚刚', content }, ...c.followUps],
    }))
      .then(() => showMessage('跟进记录已同步'))
      .catch((e) => showMessage(e.message));
  };
  const recommend = (ids: string[]) =>
    void updateCustomer(matchingCustomerId, (c) => ({
      ...c,
      status: '已推荐',
      recommendedCount: ids.length,
      recommendedNurseIds: ids,
      lastFollowUp: '刚刚',
      followUps: [
        { time: '刚刚', content: `已向客户推荐 ${ids.length} 位候选月嫂。` },
        ...c.followUps,
      ],
    }))
      .then(() => showMessage('候选人已推荐给客户'))
      .catch((e) => showMessage(e.message));
  const lock = async (nurseId: string) => {
    const customer =
      customers.find((c) => c.id === matchingCustomerId) ?? customers[0];
    if (!customer) return;
    const end = addDays(customer.dueDate, customer.serviceDays - 1);
    try {
      if (isProductionMode) {
        await productionApi.createOrder({
          customerId: customer.id,
          workerId: nurseId,
          serviceType: '月嫂服务',
          status: 'confirmed',
          startDate: customer.dueDate,
          endDate: end,
          price: customer.budgetMax,
          remark: '由匹配中心锁定',
          createSchedule: true,
        });
        await productionApi.updateCustomer({
          ...customer,
          status: '已锁定',
          lockedNurseId: nurseId,
          lastFollowUp: '刚刚',
          followUps: [
            { time: '刚刚', content: '客户确认人选，服务档期已锁定。' },
            ...customer.followUps,
          ],
        });
        await loadProduction();
      } else {
        await updateCustomer(customer.id, (c) => ({
          ...c,
          status: '已锁定',
          lockedNurseId: nurseId,
        }));
        persistNurses(
          nurses.map((n) =>
            n.id === nurseId
              ? {
                  ...n,
                  status: '已锁档',
                  availableFrom: addDays(end, 4),
                  schedule: [
                    ...n.schedule,
                    {
                      id: crypto.randomUUID(),
                      nurseId: n.id,
                      customerId: customer.id,
                      customerName: customer.name,
                      city: customer.city,
                      start: customer.dueDate,
                      end,
                      status: '已锁档',
                      note: '由智能匹配中心锁定',
                    },
                  ],
                }
              : n,
          ),
        );
      }
      showMessage('档期已锁定，并同步到订单与档期中心');
    } catch (e) {
      showMessage(e instanceof Error ? e.message : '锁定失败');
    }
  };
  const addNurseSchedule = async () => {
    if (!selectedNurse) return;
    const start = selectedNurse.availableFrom,
      end = addDays(start, 25);
    try {
      if (isProductionMode) {
        await productionApi.createSchedule({
          workerId: selectedNurse.id,
          startTime: start,
          endTime: end,
          status: 'confirmed',
          remark: '顾问新增档期',
        });
        await loadProduction();
      } else
        persistNurses(
          nurses.map((n) =>
            n.id === selectedNurse.id
              ? {
                  ...n,
                  status: '已锁档',
                  availableFrom: addDays(end, 4),
                  schedule: [
                    ...n.schedule,
                    {
                      id: crypto.randomUUID(),
                      nurseId: n.id,
                      start,
                      end,
                      status: '已锁档',
                      note: '顾问新增档期',
                    },
                  ],
                }
              : n,
          ),
        );
      showMessage('新档期已加入排期中心');
    } catch (e) {
      showMessage(e instanceof Error ? e.message : '新增档期失败');
    }
  };
  const uploadMedia = async (files: File[], metadata: MediaUploadMetadata) => {
    setMedia(await mediaService.upload(files, metadata));
    showMessage(`${files.length} 张照片已保存到当前浏览器`);
  };
  const deleteMedia = async (id: string) => {
    setMedia(await mediaService.delete(id));
    showMessage('照片已删除');
  };
  const updateMedia = async (id: string, patch: Partial<MediaAsset>) => {
    setMedia(await mediaService.updateMetadata(id, patch));
    showMessage('照片信息已更新');
  };
  const setAvatar = async (id: string) => {
    setMedia(await mediaService.setAvatar(id));
    showMessage('头像已更新');
  };
  const reset = () => {
    setCustomers(customerService.reset());
    setNurses(nurseService.reset());
    setOrders(orderService.reset());
    setMedia(mediaService.reset());
    setSelectedId('wang');
    setSelectedNurseId('nurse_001');
    showMessage('客户、月嫂、订单与相册演示数据已恢复');
  };
  const login = async (username: string, password: string) => {
    if (isProductionMode) {
      await productionApi.login(username, password);
      setLoggedIn(true);
      await loadProduction();
    } else {
      if (isGitHubPagesBuild)
        sessionStorage.setItem('yuesao-demo-pages-login', '1');
      setLoggedIn(true);
    }
  };
  const logout = async () => {
    try {
      if (isProductionMode) await productionApi.logout();
      else if (isGitHubPagesBuild)
        sessionStorage.removeItem('yuesao-demo-pages-login');
    } finally {
      setLoggedIn(false);
      navigate('dashboard');
    }
  };

  useEffect(() => {
    if (isProductionMode) return;
    type WebTool = {
      name: string;
      title: string;
      description: string;
      inputSchema: object;
      annotations: object;
      execute: (input: unknown) => unknown;
    };
    const context = (
      document as unknown as {
        modelContext?: {
          registerTool: (
            tool: WebTool,
            options: { signal: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = (tool: WebTool) => {
      try {
        void Promise.resolve(
          context.registerTool(tool, { signal: lifecycle.signal }),
        ).catch(() => {});
      } catch {}
    };
    register({
      name: 'list_customers',
      title: '查看客户列表',
      description: '读取当前 Demo 中的客户姓名、状态、预产期和预算。',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: () => ({
        customers: customers.map(
          ({ id, name, status, dueDate, budgetMin, budgetMax }) => ({
            id,
            name,
            status,
            dueDate,
            budgetMin,
            budgetMax,
          }),
        ),
      }),
    });
    register({
      name: 'list_maternity_nurses',
      title: '查看月嫂列表',
      description:
        '读取当前 Demo 的月嫂姓名、状态、技能、价格和最近可上户日期。',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: () => ({
        nurses: nurses.map(
          ({ id, name, status, skillTags, price26Days, availableFrom }) => ({
            id,
            name,
            status,
            skillTags,
            price26Days,
            availableFrom,
          }),
        ),
      }),
    });
    return () => lifecycle.abort();
  }, [customers, nurses]);

  if (authChecking)
    return <main className="app-loading">正在验证登录状态…</main>;
  if (!loggedIn)
    return <LoginView onLogin={login} production={isProductionMode} />;
  if (loading && !customers.length)
    return <main className="app-loading">正在加载业务数据…</main>;
  return (
    <>
      <AppShell view={view} onNavigate={navigate} onSoon={notify}>
        {apiError && (
          <div className="api-banner" role="alert">
            {apiError}
            <button onClick={() => void loadProduction()}>重新加载</button>
          </div>
        )}
        {view === 'dashboard' && (
          <DashboardView
            customers={customers}
            nurses={nurses}
            media={media}
            onOpenCustomer={openCustomer}
            onCreateCustomer={() => setCustomerSheetOpen(true)}
            onMatching={openMatching}
            onSchedule={() => openSchedule(nurses[0]?.id)}
            onParse={(id) => {
              setSelectedId(id);
              setDemandOpen(true);
            }}
          />
        )}
        {view === 'customers' && (
          <CustomersView
            customers={customers}
            onOpen={openCustomer}
            onCreate={() => {
              setEditingCustomer(undefined);
              setCustomerSheetOpen(true);
            }}
            onMatch={openMatching}
          />
        )}{' '}
        {view === 'detail' && selected && (
          <CustomerDetailView
            customer={selected}
            nurses={nurses}
            media={media}
            onBack={() => navigate('customers')}
            onFollow={() => setFollowupOpen(true)}
            onParse={() => setDemandOpen(true)}
            onMatch={() => openMatching(selected.id)}
            onOpenNurse={openNurse}
            onEdit={() => {
              setEditingCustomer(selected);
              setCustomerSheetOpen(true);
            }}
            onDisable={() => void disableCustomer(selected)}
          />
        )}{' '}
        {view === 'nurses' && (
          <NursesView
            nurses={nurses}
            media={media}
            initialFilter={nurseFilter}
            onOpen={openNurse}
            onCreate={() => {
              setEditingNurse(undefined);
              setNurseSheetOpen(true);
            }}
          />
        )}
        {view === 'nurseDetail' && selectedNurse && (
          <NurseDetailView
            nurse={selectedNurse}
            media={media}
            onBack={() => navigate('nurses')}
            onEdit={() => {
              setEditingNurse(selectedNurse);
              setNurseSheetOpen(true);
            }}
            onSchedule={() => openSchedule(selectedNurse.id)}
            onRecommend={() => openMatching()}
            onAddSchedule={() => void addNurseSchedule()}
            onUpload={uploadMedia}
            onDeleteMedia={deleteMedia}
            onUpdateMedia={updateMedia}
            onSetAvatar={setAvatar}
            onDisable={() => void disableWorker(selectedNurse)}
          />
        )}{' '}
        {view === 'orders' && (
          <OrdersView
            orders={orders}
            onCreate={() => {
              setEditingOrder(undefined);
              setOrderSheetOpen(true);
            }}
            onEdit={(item) => {
              setEditingOrder(item);
              setOrderSheetOpen(true);
            }}
          />
        )}{' '}
        {view === 'schedule' && (
          <ScheduleView
            nurses={nurses}
            customers={customers}
            media={media}
            focusNurseId={focusNurseId}
            onOpenNurse={openNurse}
            onOpenCustomer={openCustomer}
          />
        )}{' '}
        {view === 'matching' && (
          <MatchingView
            customers={customers}
            nurses={nurses}
            media={media}
            customerId={matchingCustomerId}
            onSelectCustomer={setMatchingCustomerId}
            onOpenNurse={openNurse}
            onParse={() => {
              setSelectedId(matchingCustomerId);
              setDemandOpen(true);
            }}
            onRecommend={recommend}
            onLock={(id) => void lock(id)}
          />
        )}{' '}
        {view === 'settings' && (
          <SettingsView
            onReset={reset}
            onLogout={() => void logout()}
            production={isProductionMode}
          />
        )}
      </AppShell>
      <NewCustomerSheet
        open={customerSheetOpen}
        onOpenChange={(open) => {
          setCustomerSheetOpen(open);
          if (!open) setEditingCustomer(undefined);
        }}
        onSave={saveCustomer}
        editing={editingCustomer}
      />
      <NurseFormSheet
        open={nurseSheetOpen}
        onOpenChange={(x) => {
          setNurseSheetOpen(x);
          if (!x) setEditingNurse(undefined);
        }}
        onSave={saveNurse}
        editing={editingNurse}
      />
      <OrderFormSheet
        key={`${editingOrder?.id ?? 'new'}-${orderSheetOpen}`}
        open={orderSheetOpen}
        onOpenChange={(open) => {
          setOrderSheetOpen(open);
          if (!open) setEditingOrder(undefined);
        }}
        customers={customers}
        nurses={nurses}
        onSave={saveOrder}
        editing={editingOrder}
      />
      {selected && (
        <>
          <DemandParserSheet
            open={demandOpen}
            onOpenChange={setDemandOpen}
            customer={selected}
            onApply={applyDemand}
          />
          <FollowupSheet
            open={followupOpen}
            onOpenChange={setFollowupOpen}
            onSave={addFollowup}
          />
        </>
      )}
      {message && <output className="toast">{message}</output>}
    </>
  );
}
export default function Home() {
  return <DemoApp />;
}
