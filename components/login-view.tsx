'use client';

import { ArrowDown, ArrowRight, CalendarDays, Check, HeartHandshake, MapPin, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { assetUrl } from '@/lib/asset-url';

export function LoginView({ onLogin }: { onLogin: () => void }) {
  return (
    <main className="portal-login">
      <div className="portal-orbit portal-orbit-one" aria-hidden="true" />
      <div className="portal-orbit portal-orbit-two" aria-hidden="true" />
      <div className="portal-stage">
        <section className="portal-intro" aria-labelledby="login-title">
          <header className="portal-brand">
            <div className="brand-mark"><HeartHandshake /></div>
            <div><strong>家政 AI</strong><span>家政业务工作台</span></div>
          </header>
          <div className="portal-copy">
            <p className="portal-kicker">日常业务协同</p>
            <h1 id="login-title">客户、人员与服务，<br />在这里协同。</h1>
            <p>一个入口，完成需求整理、人员匹配、客户跟进与服务安排。</p>
          </div>
          <div className="business-preview" aria-label="客户匹配业务预览">
            <div className="preview-caption"><span>今日匹配进展</span><em><i /> 信息已同步</em></div>
            <article className="need-preview">
              <div className="preview-icon"><span>李</span></div>
              <div className="preview-main">
                <div className="preview-title"><strong>李女士的服务需求</strong><span>待匹配</span></div>
                <p><CalendarDays /> 10月18日开始 <i /> <MapPin /> 西安 · 雁塔</p>
                <div className="preview-tags"><span>预算 ¥6,000–8,000</span><span>住家服务</span><span>老人照护</span><span>长期服务</span></div>
              </div>
            </article>
            <div className="preview-connector" aria-hidden="true"><span><Sparkles /> 智能匹配</span><ArrowDown /></div>
            <article className="nurse-preview">
              <img src={assetUrl('/demo-media/zhang-profile-thumb.webp')} alt="张红职业头像" />
              <div className="preview-main">
                <div className="preview-title"><strong>张红</strong><span className="match-score">92% 匹配</span></div>
                <p>高级家政师 · 8年经验</p>
                <div className="preview-tags"><span>老人照护</span><span>住家服务</span><span>家庭烹饪</span></div>
              </div>
              <aside className="availability-preview"><small>最近服务</small><strong>11月09日</strong><span><Check /> 档期可用</span></aside>
            </article>
            <div className="schedule-preview" aria-label="人员近期档期">
              <span><CalendarDays /> 近期档期</span>
              <div><small>10月</small><b className="locked">已锁档</b></div>
              <div><small>11月</small><b className="available">可接单</b></div>
            </div>
          </div>
        </section>
        <section className="portal-access" aria-label="登录区域">
          <div className="login-card portal-login-card">
            <div className="mobile-portal-brand">
              <div className="brand-mark"><HeartHandshake /></div>
              <div><strong>家政 AI</strong><span>家政业务工作台</span></div>
            </div>
            <p className="portal-kicker">欢迎回来</p>
            <h2>登录工作台</h2>
            <p className="muted">使用演示账号体验当前 Demo</p>
            <form onSubmit={(event) => { event.preventDefault(); onLogin(); }}>
              <label htmlFor="demo-account">账号<Input id="demo-account" defaultValue="wangmin" autoComplete="username" /></label>
              <label htmlFor="demo-password">密码<Input id="demo-password" type="password" defaultValue="demo2026" autoComplete="current-password" /></label>
              <Button type="submit" className="primary-button">进入工作台 <ArrowRight /></Button>
            </form>
            <div className="demo-note"><Check /> 演示账号已预填，无需真实身份验证</div>
          </div>
          <p className="portal-support">业务数据仅用于产品演示 · 本地安全存储</p>
        </section>
      </div>
    </main>
  );
}
