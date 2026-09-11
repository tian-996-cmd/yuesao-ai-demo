import type { ViewName } from '@/components/app-shell';

const env = (import.meta as ImportMeta & {
  env?: { VITE_GITHUB_PAGES?: string };
}).env;

export const isGitHubPagesBuild = env?.VITE_GITHUB_PAGES === 'true';

export type DemoRoute = {
  view: ViewName;
  customerId?: string;
  nurseId?: string;
  focusNurseId?: string;
};

export function currentDemoPath() {
  if (typeof window === 'undefined') return '/';
  if (!isGitHubPagesBuild) return `${window.location.pathname}${window.location.search}`;
  return window.location.hash.slice(1) || '/';
}

export function parseDemoRoute(path = currentDemoPath()): DemoRoute {
  const url = new URL(path, 'https://demo.invalid');
  const parts = url.pathname.split('/').filter(Boolean);

  if (parts[0] === 'customers' && parts[1]) return { view: 'detail', customerId: parts[1] };
  if (parts[0] === 'customers') return { view: 'customers' };
  if (parts[0] === 'nurses' && parts[1]) return { view: 'nurseDetail', nurseId: parts[1] };
  if (parts[0] === 'nurses') return { view: 'nurses' };
  if (parts[0] === 'schedule') return { view: 'schedule', focusNurseId: url.searchParams.get('nurse') ?? undefined };
  if (parts[0] === 'matching') return { view: 'matching' };
  if (parts[0] === 'settings') return { view: 'settings' };
  return { view: 'dashboard' };
}

export function pushDemoPath(path: string) {
  if (isGitHubPagesBuild) {
    window.history.pushState({}, '', `${window.location.pathname}${window.location.search}#${path}`);
  } else {
    window.history.pushState({}, '', path);
  }
}
