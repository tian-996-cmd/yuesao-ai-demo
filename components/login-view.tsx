'use client';

import { ArrowRight, CheckCircle2, HeartHandshake, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function LoginView({ onLogin }: { onLogin: () => void }) {
  return (
    <main className="login-shell">
      <section className="login-brand">
        <div className="brand-mark large"><HeartHandshake /></div>
        <div>
          <div className="eyebrow">母婴服务机构专属工作台</div>
          <h1>把每一次托付，<br />照顾得更周到。</h1>
          <p>让客户需求、月嫂匹配和跟进更简单。</p>
        </div>
        <div className="login-points">
          <span><CheckCircle2 /> 客户信息集中管理</span>
          <span><Sparkles /> 需求要点清晰沉淀</span>
          <span><ShieldCheck /> 专业、可靠的业务流程</span>
        </div>
      </section>
      <section className="login-panel">
        <div className="login-card">
          <div className="mobile-login-brand"><div className="brand-mark"><HeartHandshake /></div><span>月嫂 AI 业务助手</span></div>
          <div className="eyebrow">欢迎回来</div>
          <h2>登录工作台</h2>
          <p className="muted">使用测试账号体验当前 Demo</p>
          <form onSubmit={(event) => { event.preventDefault(); onLogin(); }}>
            <label>手机号 / 账号<Input defaultValue="wangmin" autoComplete="username" /></label>
            <label>密码<Input type="password" defaultValue="demo2026" autoComplete="current-password" /></label>
            <Button type="submit" className="primary-button">进入工作台 <ArrowRight /></Button>
          </form>
          <p className="demo-note">演示账号已预填，无需真实身份验证</p>
        </div>
      </section>
    </main>
  );
}
